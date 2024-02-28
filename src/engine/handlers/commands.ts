import {sortBy} from "ramda"
import {cached, Tags} from "paravel"
import {derived} from "src/engine/core/utils"
import {load} from "src/engine/network/utils"
import {getUserHints} from "src/engine/relays/utils"
import {follows} from "src/engine/people/derived"
import {handlers, handlerRecs} from "./state"

export const deriveHandlers = cached({
  maxSize: 10000,
  getKey: ([kind]: [number]) => kind,
  getValue: ([kind]: [number]) => {
    const $follows = follows.get()

    load({
      relays: getUserHints("read"),
      filters: [
        {kinds: [31989], "#d": [String(kind)], authors: Array.from($follows)},
        {kinds: [31990], "#k": [String(kind)]},
      ],
    })

    return derived([handlers.mapStore, handlerRecs], ([$handlers, $recs]) => {
      const result = {}

      for (const {event} of $recs.filter(
        r => Tags.fromEvent(r.event).get("d")?.value() === String(kind),
      )) {
        if (!$follows.has(event.pubkey)) {
          continue
        }

        const tags = Tags.fromEvent(event).whereKey("a")
        const tag = tags.whereMark("web").first() || tags.first()
        const address = tag?.value()
        const handler = $handlers.get(address)

        if (!handler) {
          continue
        }

        result[address] = result[address] || {...handler, recs: []}
        result[address].recs.push(event)
      }

      return sortBy((h: any) => -h.recs.length, Object.values(result))
    })
  },
})
