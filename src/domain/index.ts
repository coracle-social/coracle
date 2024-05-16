import {Tags} from "@welshman/util"
import {feedFromTags} from "@welshman/feeds"
import {makeFeed} from "./feed"
import type {List} from "./list"

export * from "./kind"
export * from "./feed"
export * from "./list"
export * from "./handler"

export const mapListToFeed = (list: List) =>
  makeFeed({
    list,
    title: list.title,
    identifier: list.identifier,
    description: list.description,
    definition: feedFromTags(Tags.fromEvent(list.event)),
  })
