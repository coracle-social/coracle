import {fromPairs, randomId} from "@welshman/lib"
import {Kind, Tags, decodeAddress} from "@welshman/util"
import type {Rumor} from "@welshman/util"
import {makeIntersectionFeed, feedFromTags, hasSubFeeds} from "@welshman/feeds"
import type {Feed as IFeed} from "@welshman/feeds"
import {tryJson} from "src/util/misc"

export type Feed = {
  name: string
  identifier: string
  description: string
  definition: IFeed
  event?: Rumor
  list?: string
}

export const normalizeFeedDefinition = feed =>
  hasSubFeeds(feed) ? feed : makeIntersectionFeed(feed)

// Compatibility with the old way we did custom feeds
export const listAsFeed = list =>
  initFeed({
    name: list.title,
    list: list.address,
    description: list.description,
    definition: feedFromTags(Tags.fromEvent(list)),
    identifier: decodeAddress(list.address).identifier,
  })

export const initFeed = (feed: Partial<Feed> = {}): Feed => ({
  name: "",
  description: "",
  identifier: randomId(),
  definition: makeIntersectionFeed(),
  ...feed,
})

export const readFeed = (event: Rumor) => {
  if (!event) {
    return null
  }

  const {d: identifier, name = "", description = "", feed = ""} = fromPairs(event.tags)
  const definition = tryJson(() => JSON.parse(feed)) || makeIntersectionFeed()

  return {name, identifier, description, definition, event} as Feed
}

export const createFeed = ({identifier, definition, name, description}: Feed) => ({
  kind: Kind.Feed,
  content: description,
  tags: [
    ["d", identifier],
    ["name", name],
    ["feed", JSON.stringify(definition)],
  ],
})

export const editFeed = (feed: Feed) => ({
  kind: Kind.Feed,
  content: feed.description,
  tags: Tags.fromEvent(feed.event)
    .setTag("name", feed.name)
    .setTag("feed", JSON.stringify(feed.definition))
    .unwrap(),
})

export const displayFeed = (feed: Feed) => (feed.name ? feed.name : "[no name]")
