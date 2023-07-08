import {identity} from "ramda"
import {ensurePlural, chunk} from "hurdak/lib/hurdak"
import {sleep} from "src/util/misc"

export default class Sync {
  ns: string
  ANY_KIND: string
  handlers = {}
  constructor(ns) {
    this.ns = ns
    this.ANY_KIND = `${ns}/ANY_KIND`
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
