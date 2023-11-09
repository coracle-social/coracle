import {prop, uniqBy, uniq} from "ramda"
import {Tags} from "paravel"
import {tryFunc, sleep} from "hurdak"
import {tryJson} from "src/util/misc"
import {appDataKeys} from "src/util/nostr"
import {EventKind} from "src/engine/events/model"
import {sessions} from "src/engine/session/state"
import {Signer, Nip04, getNdk} from "src/engine/session/utils"
import {getEventHints} from "src/engine/relays/utils"
import {projections} from "src/engine/core/projections"
import type {Channel} from "./model"
import {channels} from "./state"
import {getNip24ChannelId} from "./utils"

const getSession = pubkey => sessions.get()[pubkey]
const getSigner = session => new Signer(session, getNdk(session))
const getNip04 = session => new Nip04(session, getNdk(session))

projections.addHandler(EventKind.AppData, async e => {
  const d = Tags.from(e).getValue("d")
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
    const payload = tryJson(async () => JSON.parse(await nip04.decryptAsUser(e.content, e.pubkey)))

    if (payload) {
      const updates = {}

      for (const [id, ts] of Object.entries(payload) as [string, number][]) {
        // Ignore weird old stuff
        if (id === "undefined" || id.includes("/")) {
          continue
        }

        const channel =
          channels.key(id).get() ||
          ({
            id,
            type: "nip04",
            relays: getEventHints(e),
            messages: [],
          } as Channel)

        updates[id] = {
          ...channel,
          last_checked: Math.max(ts, channel.last_checked || 0),
        }

        // No need to lock up the UI decrypting a bunch of stuff
        await sleep(16)
      }

      channels.mapStore.update($channels => {
        for (const [k, v] of Object.entries(updates)) {
          $channels.set(k, v as Channel)
        }

        return $channels
      })
    }
  }

  if (d === appDataKeys.NIP24_LAST_CHECKED) {
    const payload = await tryJson(async () =>
      JSON.parse(await nip04.decryptAsUser(e.content, e.pubkey))
    )

    if (payload) {
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
    }
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
    const plaintext = await nip04.decryptAsUser(e.content, other)

    channels.key(other).update($channel => {
      const messages = [...($channel?.messages || []), {...e, nip04: {plaintext}}]

      const updates = {
        ...$channel,
        id: e.pubkey,
        type: "nip04",
        relays: uniq([...relays, ...($channel?.relays || [])]),
        members: [session.pubkey, other],
        messages: uniqBy(prop("id"), messages),
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
        members: pubkeys,
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
