import {randomId} from "@welshman/lib"
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
import {Feed as FeedKind} from "@welshman/domain"
import {reader} from "src/engine/core"
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

// FeedReader.definition() answers undefined for a feed with no (or unparseable) feed tag, where
// everything downstream expects a definition
export const readFeed = (event: TrustedEvent) => {
  const feedReader = reader(FeedKind)(event)

  return {
    event,
    title: feedReader.title(),
    identifier: feedReader.identifier(),
    description: feedReader.description(),
    definition: feedReader.definition() || makeIntersectionFeed(),
  } as PublishedFeed
}

export const displayFeed = (feed?: Feed) => feed?.title || "[no name]"

export const isTopicFeed = f => isTagFeed(f) && f[1] === "#t"

export const isMentionFeed = f => isTagFeed(f) && f[1] === "#p"

export const isAddressFeed = f => isTagFeed(f) && f[1] === "#a"

export const isPeopleFeed = f => isAuthorFeed(f) || isScopeFeed(f)
