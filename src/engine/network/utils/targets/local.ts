import {sleep} from "hurdak"
import {Emitter} from "paravel"
import {events} from "src/engine/events/derived"
import {matchFilters} from "../filters"

export class LocalTarget extends Emitter {
  constructor() {
    super()

    this.setMaxListeners(100)
  }

  get connections() {
    return []
  }

  async onREQ(subId, ...filters) {
    // Make sure this is async, listeners don't otherwise get attached
    await sleep(10)

    if (filters.length === 1 && filters[0].ids) {
      for (const id of filters[0].ids) {
        const event = events.key(id).get()

        if (event) {
          this.emit("EVENT", "local://coracle.relay", subId, event)
        }
      }
    } else {
      for (const event of events.get()) {
        if (matchFilters(filters, event)) {
          this.emit("EVENT", "local://coracle.relay", subId, event)
        }
      }
    }
  }

  send(verb, subid, ...args) {
    if (verb === "REQ") {
      this.onREQ(subid, ...args)
    }
  }

  cleanup = () => {
    this.removeAllListeners()
  }
}
