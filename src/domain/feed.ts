import {fromPairs} from "@welshman/lib"
import type {Rumor} from "@welshman/util"
import {makeIntersectionFeed} from "@welshman/feeds"
import {tryJson} from "src/util/misc"

export const feedFromEvent = (event: Rumor) => {
  const {d, name = "", description = "", feed = ""} = fromPairs(event.tags)
  const data = tryJson(() => JSON.parse(feed)) || makeIntersectionFeed()

  return {name, description, data, event}
}
