import {fromPairs, randomId} from "@welshman/lib"
import {FEED, Tags, getAddress} from "@welshman/util"
import type {Rumor} from "@welshman/util"
import {makeIntersectionFeed, hasSubFeeds} from "@welshman/feeds"
import type {Feed as IFeed} from "@welshman/feeds"
import {SearchHelper} from "src/util/misc"
import {tryJson} from "src/util/misc"
import type {List} from "./list"

export type Feed = {
  title: string
  identifier: string
  description: string
  definition: IFeed
  event?: Rumor
  list?: List
}

export const normalizeFeedDefinition = feed =>
  hasSubFeeds(feed) ? feed : makeIntersectionFeed(feed)

export const makeFeed = (feed: Partial<Feed> = {}): Feed => ({
  title: "",
  description: "",
  identifier: randomId(),
  definition: makeIntersectionFeed(),
  ...feed,
})

export const readFeed = (event: Rumor) => {
  const {d: identifier, title = "", description = "", feed = ""} = fromPairs(event.tags)
  const definition = tryJson(() => JSON.parse(feed)) || makeIntersectionFeed()

  return {title, identifier, description, definition, event} as Feed
}

export const createFeed = ({identifier, definition, title, description}: Feed) => ({
  kind: FEED,
  content: description,
  tags: [
    ["d", identifier],
    ["title", title],
    ["feed", JSON.stringify(definition)],
  ],
})

export const editFeed = (feed: Feed) => ({
  kind: FEED,
  content: feed.description,
  tags: Tags.fromEvent(feed.event)
    .setTag("title", feed.title)
    .setTag("feed", JSON.stringify(feed.definition))
    .unwrap(),
})

export const displayFeed = (feed?: Feed) => feed?.title || "[no name]"

export class FeedSearch extends SearchHelper<Feed, string> {
  config = {keys: ["title", "description"]}
  getValue = (option: Feed) => getAddress(option.event)
  display = (address: string) =>
    displayFeed(this.options.find(feed => this.getValue(feed) === address))
}
