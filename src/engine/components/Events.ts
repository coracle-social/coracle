import type {Event} from "src/engine/types"
import {pushToKey} from "src/util/misc"
import {queue} from "../util/queue"
import {collection} from "../util/store"

export const ANY_KIND = "Events/ANY_KIND"

export class Events {
  static contributeState() {
    return {
      queue: queue(),
      cache: collection<Event>("id"),
      handlers: {},
    }
  }

  static contributeActions({Events}) {
    const addHandler = (kind, f) => pushToKey(Events.handlers, kind, f)

    return {addHandler}
  }

  static initialize({Events, Keys}) {
    Events.queue.listen(async event => {
      if (event.pubkey === Keys.pubkey.get()) {
        Events.cache.key(event.id).set(event)
      }

      for (const handler of Events.handlers[ANY_KIND] || []) {
        await handler(event)
      }

      for (const handler of Events.handlers[event.kind] || []) {
        await handler(event)
      }
    })
  }
}
