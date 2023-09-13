import {uniq, prop, uniqBy} from "ramda"
import {tryFunc, sleep} from "hurdak"
import {tryJson} from "src/util/misc"
import {Tags, appDataKeys} from "src/util/nostr"
import type {Channel} from "src/engine2/model"
import {EventKind} from "src/engine2/model"
import {channels} from "src/engine2/state"
import {user, nip04, canSign} from "src/engine2/queries"
import {projections} from "src/engine2/projections/core"

projections.addHandler(30078, async e => {
  if (canSign.get() && Tags.from(e).getMeta("d") === appDataKeys.NIP04_LAST_CHECKED) {
    channels.mapStore.updateAsync(async $channels => {
      await tryJson(async () => {
        const payload = JSON.parse(await nip04.get().decryptAsUser(e.content, user.get().pubkey))

        for (const [id, ts] of Object.entries(payload) as [string, number][]) {
          // Ignore weird old stuff
          if (id === "undefined" || id.includes("/")) {
            continue
          }

          const channel =
            $channels.get(id) || ({id, type: "nip04", relays: e.seen_on, messages: []} as Channel)

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
})

projections.addHandler(EventKind.Nip04Message, async e => {
  if (!canSign.get()) {
    return
  }

  const {pubkey} = user.get()
  const tags = Tags.from(e)
  const relays = tags.relays()
  const recipient = tags.type("p").values().first()

  await tryFunc(async () => {
    const other = pubkey === e.pubkey ? recipient : e.pubkey
    const content = await nip04.get().decryptAsUser(e.content, other)

    channels.key(e.pubkey).update($channel => {
      const updates = {
        ...$channel,
        id: e.pubkey,
        type: "nip04",
        relays: uniq(relays.concat($channel?.relays || [])),
        messages: uniqBy(prop("id"), [{...e, content}].concat($channel?.messages || [])),
      }

      if (e.pubkey === pubkey) {
        updates.last_sent = Math.max(updates.last_sent || 0, e.created_at)
      } else {
        updates.last_received = Math.max(updates.last_received || 0, e.created_at)
      }

      return updates as Channel
    })
  })
})
