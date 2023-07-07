import {identity} from "ramda"
import {ensurePlural, chunk} from "hurdak/lib/hurdak"
import {sleep} from "src/util/misc"

export default ({keys}) => {
  const ANY_KIND = "system/sync/ANY_KIND"
  const handlers = {}

  const addHandler = (kind, f) => {
    handlers[kind] = handlers[kind] || []
    handlers[kind].push(f)
  }

  const processEvents = async events => {
    const chunks = chunk(100, ensurePlural(events).filter(identity))

    for (let i = 0; i < chunks.length; i++) {
      for (const event of chunks[i]) {
        for (const handler of handlers[ANY_KIND] || []) {
          await handler(event)
        }

        for (const handler of handlers[event.kind] || []) {
          await handler(event)
        }
      }

      // Don't lock up the ui when processing a lot of events
      if (i < chunks.length - 1) {
        await sleep(30)
      }
    }
  }

  return {ANY_KIND, processEvents, addHandler}
}
