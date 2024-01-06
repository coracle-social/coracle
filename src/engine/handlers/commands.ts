import {last, sortBy} from "ramda"
import {first} from "hurdak"
import {cached, Tags} from "paravel"
import {derived} from "src/engine/core/utils"
import {load} from "src/engine/network/utils"
import {getUserRelayUrls} from "src/engine/relays/utils"
import {follows} from "src/engine/people/derived"
import {handlers, handlerRecs} from "./state"

export const deriveHandlers = cached({
  maxSize: 10000,
  getKey: ([kind]: [string]) => kind,
  getValue: ([kind]: [string]) => {
    const $follows = follows.get()

    load({
      relays: getUserRelayUrls("read"),
      filters: [
        {kinds: [31989], "#d": [String(kind)], authors: Array.from($follows)},
        {kinds: [31990], "#k": [String(kind)]},
      ],
    })

    return derived([handlers.mapStore, handlerRecs], ([$handlers, $recs]) => {
      const result = {}

      for (const {event} of $recs.filter(r => Tags.from(r.event).getValue("d") === String(kind))) {
        if (!$follows.has(event.pubkey)) {
          continue
        }

        const tags = Tags.from(event).type("a").all()
        const tag = tags.find(t => last(t) === "web") || first(tags)
        const address = tag?.[1]
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
