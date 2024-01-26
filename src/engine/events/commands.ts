import {chunk, seconds} from 'hurdak'
import {createEvent, now} from 'paravel'
import {generatePrivateKey} from "src/util/nostr"
import {session, signer, nip04, nip44, nip59} from 'src/engine/session/derived'
import {getUserRelayUrls} from 'src/engine/relays/utils'
import {Publisher} from 'src/engine/network/utils'

export const markAsSeen = async (allEvents: Event[], {visibility = 'private'} = {}) => {
  if (!signer.get().isEnabled()) {
    return
  }

  const pubs = []
  const events = []
  const {pubkey} = session.get()
  const relays = getUserRelayUrls('write')

  console.log('markAsSeen', allEvents)

  for (const batch of chunk(500, allEvents)) {
    const template = createEvent(15, {
      tags: [["expiration", now() + seconds(90, "day")], ...batch.map(e => ["e", e.id])],
    })

    if (visibility === 'private' && nip44.get().isEnabled()) {
      const rumor = await nip59.get().wrap(template, {
        wrap: {
          author: generatePrivateKey(),
          recipient: pubkey,
        },
      })

      events.push(rumor)
      pubs.push(Publisher.publish({event: rumor.wrap, relays}))
    } else if (visibility === 'private' && nip04.get().isEnabled()) {
      const rumor = await nip59.get().wrap(template, {
        wrap: {
          kind: 1060,
          algo: 'nip04',
          author: generatePrivateKey(),
          recipient: pubkey,
        },
      })

      events.push(rumor)
      pubs.push(Publisher.publish({event: rumor.wrap, relays}))
    } else {
      const event = await signer.get().signAsUser(template)

      events.push(event)
      pubs.push(Publisher.publish({event: event, relays}))
    }
  }

  return {pubs, events}
}
