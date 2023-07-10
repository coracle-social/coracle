import {identity} from "ramda"
import {ensurePlural, chunk} from "hurdak/lib/hurdak"
import {sleep} from "src/util/misc"
import type {System} from "src/system/system"

export class Sync {
  handlers = {}
  system: System
  ANY_KIND: string

  constructor(system) {
    this.system = system
    this.ANY_KIND = this.system.key("ANY_KIND")
  }

  addHandler(kind, f) {
    this.handlers[kind] = this.handlers[kind] || []
    this.handlers[kind].push(f)
  }

  async processEvents(events) {
    const chunks = chunk(100, ensurePlural(events).filter(identity))

    for (let i = 0; i < chunks.length; i++) {
      for (const event of chunks[i]) {
        for (const handler of this.handlers[this.ANY_KIND] || []) {
          await handler(event)
        }

        for (const handler of this.handlers[event.kind] || []) {
          await handler(event)
        }
      }

      // Don't lock up the ui when processing a lot of events
      if (i < chunks.length - 1) {
        await sleep(30)
      }
    }
  }
}
