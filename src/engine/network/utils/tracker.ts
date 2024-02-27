import {ensurePlural} from "hurdak"
import {isShareableRelayUrl} from "paravel"

export class Tracker {
  urlsByEventId = new Map()

  add = (event, urls) => {
    const seen = this.urlsByEventId.get(event.id)

    event.seen_on = seen || []

    for (const url of ensurePlural(urls)) {
      if (!event.seen_on.includes(url) && isShareableRelayUrl(url)) {
        event.seen_on.push(url)
      }
    }

    this.urlsByEventId.set(event.id, event.seen_on)

    return Boolean(seen)
  }
}
