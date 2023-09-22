import {prop, map, assocPath, pluck, last, uniqBy, uniq} from "ramda"
import {tryFunc, sleep} from "hurdak"
import {tryJson} from "src/util/misc"
import {Tags, appDataKeys} from "src/util/nostr"
import type {Event} from "src/engine/events/model"
import {EventKind} from "src/engine/events/model"
import {sessions} from "src/engine/session/state"
import {Signer, Nip04, getNdk} from "src/engine/session/utils"
import {getEventHints} from "src/engine/relays/utils"
import {projections} from "src/engine/core/projections"
import {updateRecord, updateStore} from "src/engine/core/commands"
import type {Channel} from "./model"
import {channels, nip28ChannelsLastJoined} from "./state"
import {getNip24ChannelId} from "./utils"

const getSession = pubkey => sessions.get()[pubkey]
const getSigner = session => new Signer(session, getNdk(session))
const getNip04 = session => new Nip04(session, getNdk(session))

projections.addHandler(EventKind.AppData, async e => {
  const d = Tags.from(e).getMeta("d")
  const session = getSession(e.pubkey)

  if (!session) {
    return
  }

  const signer = getSigner(session)

  if (!signer.canSign()) {
    return
  }

  const nip04 = getNip04(session)

  if (d === appDataKeys.NIP04_LAST_CHECKED) {
    channels.mapStore.updateAsync(async $channels => {
      await tryJson(async () => {
        const payload = JSON.parse(await nip04.decryptAsUser(e.content, e.pubkey))

        for (const [id, ts] of Object.entries(payload) as [string, number][]) {
          // Ignore weird old stuff
          if (id === "undefined" || id.includes("/")) {
            continue
          }

          const channel =
            $channels.get(id) ||
            ({
              id,
              type: "nip04",
              relays: getEventHints(e),
              messages: [],
            } as Channel)

          $channels.set(id, {
            ...channel,
            last_checked: Math.max(ts, channel.last_checked || 0),
          })

          // No need to lock up the UI decrypting a bunch of stuff
          await sleep(16)
        }
      })

      return $channels
    })
  }

  if (d === appDataKeys.NIP24_LAST_CHECKED) {
    await tryJson(async () => {
      const payload = JSON.parse(await nip04.decryptAsUser(e.content, e.pubkey))

      channels.mapStore.update($channels => {
        for (const [id, ts] of Object.entries(payload) as [string, number][]) {
          const channel = $channels.get(id)

          $channels.set(id, {
            ...channel,
            last_checked: Math.max(ts, channel?.last_checked || 0),
          })
        }

        return $channels
      })
    })
  }

  if (d === appDataKeys.NIP28_ROOMS_JOINED && e.created_at > nip28ChannelsLastJoined.get()) {
    nip28ChannelsLastJoined.set(e.created_at)

    await tryJson(async () => {
      const channelIds = JSON.parse(await nip04.decryptAsUser(e.content, e.pubkey))

      // Just a bug from when I was building the feature, remove someday
      if (!Array.isArray(channelIds)) {
        return
      }

      channels.update(
        map(channel => {
          if (channel.nip28?.joined && !channelIds.includes(channel.id)) {
            return assocPath(["nip28", "joined"], false, channel)
          } else if (!channel.nip28?.joined && channelIds.includes(channel.id)) {
            return assocPath(["nip28", "joined"], true, channel)
          }

          return channel
        })
      )
    })
  }

  if (d === appDataKeys.NIP28_LAST_CHECKED) {
    await tryJson(async () => {
      const payload = JSON.parse(await nip04.decryptAsUser(e.content, e.pubkey))

      channels.mapStore.update($channels => {
        for (const key of Object.keys(payload)) {
          // Backwards compat from when we used to prefix id/pubkey
          const id = last(key.split("/"))
          const channel = $channels.get(id)
          const last_checked = Math.max(payload[id], channel?.last_checked || 0)

          // A bunch of junk got added to this setting. Integer keys, settings, etc
          if (isNaN(last_checked) || last_checked < 1577836800) {
            continue
          }

          $channels.set(id, {...channel, id, last_checked})
        }

        return $channels
      })
    })
  }
})

projections.addHandler(EventKind.Nip04Message, async e => {
  const tags = Tags.from(e)
  const relays = tags.relays()
  const recipient = tags.type("p").values().first()
  const session = getSession(e.pubkey) || getSession(recipient)

  if (!session) {
    return
  }

  const signer = getSigner(session)

  if (!signer.canSign()) {
    return
  }

  const nip04 = getNip04(session)

  await tryFunc(async () => {
    const other = session.pubkey === e.pubkey ? recipient : e.pubkey
    const content = await nip04.decryptAsUser(e.content, other)

    channels.key(other).update($channel => {
      const updates = {
        ...$channel,
        id: e.pubkey,
        type: "nip04",
        relays: uniq([...relays, ...($channel?.relays || [])]),
        messages: uniqBy(prop("id"), [{...e, content}, ...($channel?.messages || [])]),
      }

      if (e.pubkey === session.pubkey) {
        updates.last_sent = Math.max(updates.last_sent || 0, e.created_at)
      } else {
        updates.last_received = Math.max(updates.last_received || 0, e.created_at)
      }

      return updates as Channel
    })
  })
})

projections.addHandler(EventKind.Nip44Message, e => {
  const tags = Tags.from(e)
  const pubkeys = tags.type("p").values().all().concat(e.pubkey)
  const channelId = getNip24ChannelId(pubkeys)

  for (const pubkey of Object.keys(sessions.get())) {
    if (!pubkeys.includes(pubkey)) {
      continue
    }

    channels.key(channelId).update($channel => {
      const updates = {
        ...$channel,
        id: channelId,
        type: "nip24",
        relays: uniq([...tags.relays(), ...($channel?.relays || [])]),
        messages: uniqBy(prop("id"), [e, ...($channel?.messages || [])]),
      }

      if (e.pubkey === pubkey) {
        updates.last_sent = Math.max(updates.last_sent || 0, e.created_at)
      } else {
        updates.last_received = Math.max(updates.last_received || 0, e.created_at)
      }

      return updates as Channel
    })
  }
})

projections.addHandler(EventKind.ChannelCreation, (e: Event) => {
  const meta = tryJson(() => JSON.parse(e.content))
  const relays = Tags.from(e).relays()

  if (meta?.name) {
    channels.key(e.id).update($channel => ({
      ...updateRecord($channel, e.created_at, {meta, relays}),
      nip28: {...$channel?.nip28, owner: e.pubkey},
      type: "nip28",
    }))
  }
})

projections.addHandler(EventKind.ChannelMetadata, (e: Event) => {
  const channelId = Tags.from(e).getMeta("e")

  if (!channelId) {
    return
  }

  const channel = channels.key(channelId).get()

  if (e.pubkey !== channel?.nip28?.owner) {
    return
  }

  const meta = tryJson(() => JSON.parse(e.content))
  const relays = Tags.from(e).relays()

  if (meta?.name) {
    updateStore(channels.key(channelId), e.created_at, {meta, relays})
  }
})

projections.addHandler(EventKind.ChannelMessage, (e: Event) => {
  const tags = Tags.from(e)
  const channelId = tags.getMeta("e")
  const pubkeys = pluck("pubkey", Object.values(sessions.get()))

  if (!channelId) {
    return
  }

  channels.key(channelId).update($channel => {
    const updates = {
      ...$channel,
      id: channelId,
      type: "nip28",
      relays: uniq([...tags.relays(), ...($channel?.relays || [])]),
      messages: uniqBy(prop("id"), [e, ...($channel?.messages || [])]),
    }

    if (pubkeys.includes(e.pubkey)) {
      updates.last_sent = Math.max(updates.last_sent || 0, e.created_at)
    } else {
      updates.last_received = Math.max(updates.last_received || 0, e.created_at)
    }

    return updates as Channel
  })
})
