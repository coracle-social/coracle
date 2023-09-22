import {ensurePlural} from "hurdak"
import {isShareableRelay} from "src/engine/relays/utils"

export class Tracker {
  urlsByEventId = new Map()

  add(event, urls) {
    const seen = this.urlsByEventId.get(event.id)

    event.seen_on = seen || []

    for (const url of ensurePlural(urls)) {
      if (!event.seen_on.includes(url) && isShareableRelay(url)) {
        event.seen_on.push(url)
      }
    }

    this.urlsByEventId.set(event.id, event.seen_on)

    return Boolean(seen)
  }
}
