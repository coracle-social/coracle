import {pluck} from "ramda"
import {chunk, seconds} from "hurdak"
import {createEvent, now} from "paravel"
import {generatePrivateKey} from "src/util/nostr"
import {pubkey} from "src/engine/session/state"
import {signer, nip44, nip59} from "src/engine/session/derived"
import {hints} from "src/engine/relays/utils"
import {Publisher} from "src/engine/network/utils"
import type {Event} from "./model"
import {seen} from "./state"

export const markAsSeen = async (events: Event[]) => {
  if (!signer.get().isEnabled() || events.length === 0) {
    return
  }

  const ids = pluck("id", events)

  // Eagerly update to make the UX smooth
  seen.mapStore.update($m => {
    for (const id of ids) {
      if (!$m.has(id)) {
        $m.set(id, {id})
      }
    }

    return $m
  })

  const notSynced = seen.get().filter(x => !x.published)

  if (notSynced.length > 100) {
    const expirationTag = ["expiration", String(now() + seconds(90, "day"))]

    for (const ids of chunk(500, pluck("id", notSynced))) {
      const template = createEvent(15, {
        tags: [expirationTag, ...ids.map(id => ["e", id])],
      })

      if (nip44.get().isEnabled()) {
        const rumor = await nip59.get().wrap(template, {
          wrap: {
            author: generatePrivateKey(),
            recipient: pubkey.get(),
          },
        })

        rumor.wrap.tags.push(expirationTag)

        Publisher.publish({
          event: rumor.wrap,
          relays: hints.WriteRelays().getUrls(),
        })
      } else {
        Publisher.publish({
          event: await signer.get().signAsUser(template),
          relays: hints.WriteRelays().getUrls(),
        })
      }
    }
  }
}
