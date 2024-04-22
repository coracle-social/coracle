import {prop, whereEq, uniqBy, uniq} from "ramda"
import {Tags} from "@welshman/util"
import {tryJson} from "src/util/misc"
import {appDataKeys} from "src/util/nostr"
import {sessions} from "src/engine/session/state"
import {getSession, getNip04} from "src/engine/session/utils"
import {projections} from "src/engine/core/projections"
import type {Channel} from "./model"
import {channels} from "./state"
import {getChannelId} from "./utils"

projections.addHandler(30078, async e => {
  const d = Tags.fromEvent(e).get("d")?.value()
  const session = getSession(e.pubkey)

  if (!session) {
    return
  }

  const nip04 = getNip04(session)

  if (!nip04.isEnabled()) {
    return
  }

  if (d === appDataKeys.NIP24_LAST_CHECKED) {
    const payload = await tryJson(async () =>
      JSON.parse(await nip04.decryptAsUser(e.content, e.pubkey)),
    )

    if (payload) {
      channels.mapStore.update($channels => {
        for (const [id, ts] of Object.entries(payload) as [string, number][]) {
          const channel = $channels.get(id)

          $channels.set(id, {
            relays: [],
            members: [],
            messages: [],
            ...channel,
            last_checked: Math.max(ts, channel?.last_checked || 0),
          })
        }

        return $channels
      })
    }
  }
})

const handleMessage = async e => {
  const tags = Tags.fromEvent(e)
  const pubkeys = uniq(tags.values("p").valueOf().concat(e.pubkey)) as string[]
  const channelId = getChannelId(pubkeys)

  for (const pubkey of Object.keys(sessions.get())) {
    if (!pubkeys.includes(pubkey)) {
      continue
    }

    const $channel = channels.key(channelId).get()

    const relays = $channel?.relays || []
    const messages = $channel?.messages || []

    // If we already have the message we're done
    if (messages.find(whereEq({id: e.id}))) {
      return $channel
    }

    // Handle nip04
    if (e.kind === 4) {
      const recipient = tags.get("p")?.value()
      const session = getSession(e.pubkey) || getSession(recipient)

      if (!session) {
        return
      }

      const nip04 = getNip04(session)

      if (!nip04.isEnabled()) {
        return
      }

      const other = e.pubkey === session.pubkey ? recipient : e.pubkey

      e = {...e, content: await nip04.decryptAsUser(e.content, other)}
    }

    const updates: Channel = {
      ...$channel,
      id: channelId,
      relays: uniq([...tags.relays().valueOf(), ...relays]),
      messages: uniqBy(prop("id"), [e, ...messages]),
      members: pubkeys,
    }

    if (e.pubkey === pubkey) {
      updates.last_sent = Math.max(updates.last_sent || 0, e.created_at)
    } else {
      updates.last_received = Math.max(updates.last_received || 0, e.created_at)
    }

    channels.key(channelId).set(updates)
  }
}

projections.addHandler(4, handleMessage)
projections.addHandler(14, handleMessage)
