import {prop, uniqBy, uniq} from "ramda"
import {Tags} from "paravel"
import {tryJson} from "src/util/misc"
import {appDataKeys} from "src/util/nostr"
import {EventKind} from "src/engine/events/model"
import {sessions} from "src/engine/session/state"
import {Signer, Nip04, getNdk} from "src/engine/session/utils"
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

  if (d === appDataKeys.NIP24_LAST_CHECKED) {
    const payload = await tryJson(async () =>
      JSON.parse(await nip04.decryptAsUser(e.content, e.pubkey)),
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
        relays: uniq([...tags.relays().all(), ...($channel?.relays || [])]),
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
