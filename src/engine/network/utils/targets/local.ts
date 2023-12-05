import {uniq, prop} from "ramda"
import {sleep} from "hurdak"
import {Emitter, matchFilters} from "paravel"
import {LOCAL_RELAY_URL} from "src/util/nostr"
import {_events} from "src/engine/events/state"
import {events, eventsByKind} from "src/engine/events/derived"

const subs = new Map()

const onREQ = async (target, subId, ...filters) => {
  // Make sure this is async, listeners don't otherwise get attached
  await sleep(10)

  const tryEvent = event => {
    if (event && matchFilters(filters, event)) {
      target.emit("EVENT", LOCAL_RELAY_URL, subId, event)
    }
  }

  // Keep track of subs we need to respond to
  subs.set(subId, {target, filters})

  if (filters.length === 1 && filters[0].ids) {
    for (const id of filters[0].ids) {
      tryEvent(events.key(id).get())
    }
  } else {
    let $events

    // Optimization: only iterate over events with the kinds we want
    if (filters.every(prop("kinds"))) {
      const kinds = uniq(filters.flatMap(prop("kinds")))
      const $eventsByKind = eventsByKind.get()

      $events = kinds.flatMap(k => $eventsByKind[k] || [])
    } else {
      $events = events.get()
    }

    for (const event of $events) {
      tryEvent(event)
    }
  }

  target.emit("EOSE", LOCAL_RELAY_URL, subId)
}

const onCLOSE = (target, subId) => {
  subs.delete(subId)
}

const onEVENT = (target, event) => {
  // Add to our cache
  _events.key(event.id).set(event)

  // Notify active subs
  for (const [subId, {target, filters}] of subs.entries()) {
    if (matchFilters(filters, event)) {
      target.emit("EVENT", LOCAL_RELAY_URL, subId, event)
    }
  }
}

export class LocalTarget extends Emitter {
  constructor() {
    super()

    this.setMaxListeners(100)
  }

  get connections() {
    return []
  }

  send(verb, ...args) {
    if (verb === "REQ") onREQ(this, args[0], ...args.slice(1))
    if (verb === "CLOSE") onCLOSE(this, args[0])
    if (verb === "EVENT") onEVENT(this, args[0])
  }

  cleanup = () => {
    this.removeAllListeners()
  }
}
