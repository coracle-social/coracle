import {pushToKey} from "src/util/misc"
import {queue} from "../util/queue"

export const ANY_KIND = "Events/ANY_KIND"

export function contributeState() {
  return {
    queue: queue(),
    handlers: {},
  }
}

export function contributeActions({Events}) {
  const addHandler = (kind, f) => pushToKey(Events.handlers, kind, f)

  return {addHandler}
}

export function initialize({Events}) {
  Events.queue.listen(async event => {
    for (const handler of Events.handlers[ANY_KIND] || []) {
      await handler(event)
    }

    for (const handler of Events.handlers[event.kind] || []) {
      await handler(event)
    }
  })
}
