import type {Event} from "src/engine/types"
import {pushToKey} from "src/util/misc"
import {Worker} from "src/engine/util/Worker"
import {collection} from "src/engine/util/store"
import type {Engine} from "src/engine/Engine"

export const ANY_KIND = "Events/ANY_KIND"

export class Events {
  handlers = {} as Record<string, Array<(e: Event) => void>>
  queue = new Worker<Event>()
  cache = collection<Event>("id")
  addHandler = (kind: number, f: (e: Event) => void) => pushToKey(this.handlers, kind.toString(), f)

  initialize(engine: Engine) {
    this.queue.listen(async event => {
      if (event.pubkey === engine.Keys.pubkey.get()) {
        this.cache.key(event.id).set(event)
      }

      for (const handler of this.handlers[ANY_KIND] || []) {
        await handler(event)
      }

      for (const handler of this.handlers[event.kind.toString()] || []) {
        await handler(event)
      }
    })
  }
}
