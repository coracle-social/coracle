import {pluck, uniq, flatten} from "ramda"
import {chunk, batch, seconds} from "hurdak"
import {createEvent, now} from "paravel"
import {generatePrivateKey} from "src/util/nostr"
import {pubkey} from "src/engine/session/state"
import {signer, nip44, nip59} from "src/engine/session/derived"
import {hints} from "src/engine/relays/utils"
import {Publisher} from "src/engine/network/utils"
import type {Event} from "./model"
import {seenIds} from "./state"

const getExpirationTag = () => ["expiration", String(now() + seconds(90, "day"))]

const createReadReceipt = ids =>
  createEvent(15, {
    tags: [getExpirationTag(), ...ids.map(id => ["e", id])],
  })

export const markAsSeenPublicly = batch(5000, async idChunks => {
  for (const ids of chunk(500, uniq(flatten(idChunks)))) {
    const event = await signer.get().signAsUser(createReadReceipt(ids))

    if (event) {
      Publisher.publish({event, relays: hints.WriteRelays().getUrls()})
    }
  }
})

export const markAsSeenPrivately = batch(5000, async idChunks => {
  for (const ids of chunk(500, uniq(flatten(idChunks)))) {
    const template = createReadReceipt(ids)

    const rumor = await nip59.get().wrap(template, {
      wrap: {
        author: generatePrivateKey(),
        recipient: pubkey.get(),
      },
    })

    rumor.wrap.tags.push(getExpirationTag())

    Publisher.publish({
      event: rumor.wrap,
      relays: hints.WriteRelays().getUrls(),
    })
  }
})

export const markAsSeen = async (events: Event[], {visibility = "private"} = {}) => {
  if (!signer.get().isEnabled() || events.length === 0) {
    return
  }

  const ids = pluck("id", events)

  // Eagerly update seenIds to make the UX smooth
  seenIds.update($seenIds => {
    for (const id of ids) {
      $seenIds.add(id)
    }

    return $seenIds
  })

  if (visibility === "private" && nip44.get().isEnabled()) {
    markAsSeenPrivately(ids)
  } else {
    markAsSeenPublicly(ids)
  }
}
