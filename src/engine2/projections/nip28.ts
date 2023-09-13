import {prop, map, assocPath, pluck, last, uniqBy, uniq} from "ramda"
import {Tags, appDataKeys} from "src/util/nostr"
import {tryJson} from "src/util/misc"
import type {Event, Channel} from "src/engine2/model"
import {sessions, channels} from "src/engine2/state"
import {nip04, canSign} from "src/engine2/queries"
import {projections, updateRecord, updateStore} from "src/engine2/projections/core"

projections.addHandler(40, (e: Event) => {
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

projections.addHandler(41, (e: Event) => {
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

projections.addHandler(30078, async (e: Event) => {
  if (!canSign.get()) {
    return
  }

  if (Tags.from(e).getMeta("d") === appDataKeys.NIP28_ROOMS_JOINED) {
    await tryJson(async () => {
      const channelIds = JSON.parse(await nip04.get().decryptAsUser(e.content, e.pubkey))

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

  if (Tags.from(e).getMeta("d") === appDataKeys.NIP28_LAST_CHECKED) {
    await tryJson(async () => {
      const payload = JSON.parse(await nip04.get().decryptAsUser(e.content, e.pubkey))

      for (const key of Object.keys(payload)) {
        // Backwards compat from when we used to prefix id/pubkey
        const id = last(key.split("/"))
        const channel = channels.key(id).get()
        const last_checked = Math.max(payload[id], channel?.last_checked || 0)

        // A bunch of junk got added to this setting. Integer keys, settings, etc
        if (isNaN(last_checked) || last_checked < 1577836800) {
          continue
        }

        channels.key(id).merge({last_checked})
      }
    })
  }
})

projections.addHandler(42, (e: Event) => {
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
      relays: uniq(tags.relays().concat($channel?.relays || [])),
      messages: uniqBy(prop("id"), [e].concat($channel?.messages || [])),
    }

    if (pubkeys.includes(e.pubkey)) {
      updates.last_sent = Math.max(updates.last_sent || 0, e.created_at)
    } else {
      updates.last_received = Math.max(updates.last_received || 0, e.created_at)
    }

    return updates as Channel
  })
})
