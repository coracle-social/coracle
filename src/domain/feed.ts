import {fromPairs, randomId} from "@welshman/lib"
import {FEED, Address} from "@welshman/util"
import type {TrustedEvent} from "@welshman/util"
import {
  feedFromTags,
  makeIntersectionFeed,
  hasSubFeeds,
  isTagFeed,
  isAuthorFeed,
  isScopeFeed,
} from "@welshman/feeds"
import type {Feed as IFeed} from "@welshman/feeds"
import {parseJson} from "src/util/misc"
import type {PublishedUserList} from "./list"

export type Feed = {
  title: string
  identifier: string
  description: string
  definition: IFeed
  event?: TrustedEvent
  list?: PublishedUserList
}

export type PublishedFeed = Omit<Feed, "event"> & {
  event: TrustedEvent
}

export type PublishedListFeed = Omit<Feed, "list"> & {
  event: TrustedEvent
  list: PublishedUserList
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

export const mapListToFeed = (list: PublishedUserList) =>
  makeFeed({
    list,
    event: list.event,
    title: list.title,
    identifier: list.identifier,
    description: list.description,
    definition: feedFromTags(list.event.tags),
  }) as PublishedListFeed

export const readFeed = (event: TrustedEvent) => {
  const {d: identifier, title = "", description = "", feed = ""} = fromPairs(event.tags)
  const definition = parseJson(feed) || makeIntersectionFeed()

  return {title, identifier, description, definition, event} as PublishedFeed
}

export const createFeed = ({identifier, definition, title, description}: Feed) => ({
  kind: FEED,
  content: "",
  tags: [
    ["d", identifier],
    ["alt", title],
    ["title", title],
    ["description", description],
    ["feed", JSON.stringify(definition)],
  ],
})

export const editFeed = (feed: PublishedFeed) => ({
  kind: FEED,
  content: feed.event.content,
  tags: Object.entries({
    ...fromPairs(feed.event.tags),
    title: feed.title,
    alt: feed.title,
    description: feed.description,
    feed: JSON.stringify(feed.definition),
  }),
})

export const displayFeed = (feed?: Feed) => feed?.title || "[no name]"

export const isTopicFeed = f => isTagFeed(f) && f[1] === "#t"

export const isMentionFeed = f => isTagFeed(f) && f[1] === "#p"

export const isAddressFeed = f => isTagFeed(f) && f[1] === "#a"

export const isContextFeed = f =>
  isTagFeed(f) && f[1] === "#a" && f.slice(2).every(Address.isAddress)

export const isPeopleFeed = f => isAuthorFeed(f) || isScopeFeed(f)
