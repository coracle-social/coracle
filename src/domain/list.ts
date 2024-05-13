import {fromPairs, randomId} from "@welshman/lib"
import type {TrustedEvent} from "@welshman/util"
import {
  FOLLOWS,
  NAMED_PEOPLE,
  NAMED_RELAYS,
  NAMED_CURATIONS,
  NAMED_WIKI_AUTHORS,
  NAMED_WIKI_RELAYS,
  NAMED_EMOJIS,
  NAMED_TOPICS,
  NAMED_ARTIFACTS,
  MUTES,
  PINS,
  RELAYS,
  BOOKMARKS,
  COMMUNITIES,
  CHANNELS,
  BLOCKED_RELAYS,
  SEARCH_RELAYS,
  GROUPS,
  TOPICS,
  getAddress,
  Tags,
} from "@welshman/util"
import {SearchHelper} from "src/util/misc"

export const LIST_KINDS = [
  FOLLOWS,
  NAMED_PEOPLE,
  NAMED_RELAYS,
  NAMED_CURATIONS,
  NAMED_WIKI_AUTHORS,
  NAMED_WIKI_RELAYS,
  NAMED_EMOJIS,
  NAMED_TOPICS,
  NAMED_ARTIFACTS,
  MUTES,
  PINS,
  RELAYS,
  BOOKMARKS,
  COMMUNITIES,
  CHANNELS,
  BLOCKED_RELAYS,
  SEARCH_RELAYS,
  GROUPS,
  TOPICS,
]

export const EDITABLE_LIST_KINDS = [NAMED_PEOPLE, NAMED_RELAYS, NAMED_TOPICS]

export type List = {
  kind: number
  title: string
  description: string
  identifier: string
  tags: string[][]
  event?: TrustedEvent
}

export const makeList = (list: Partial<List> = {}): List => ({
  kind: NAMED_PEOPLE,
  title: "",
  description: "",
  identifier: randomId(),
  tags: [],
  ...list,
})

export const readList = (event: TrustedEvent) => {
  const {d: identifier, title = "", description = ""} = fromPairs(event.tags)

  return {kind: event.kind, title, description, identifier, tags: event.tags, event} as List
}

export const createList = ({kind, title, description, identifier, tags}: List) => ({
  kind,
  content: description,
  tags: Tags.wrap(tags).setTag("d", identifier).setTag("title", title).unwrap(),
})

export const editList = ({kind, title, description, identifier, tags}: List) => ({
  kind: kind,
  content: description,
  tags: Tags.wrap(tags).setTag("d", identifier).setTag("title", title).unwrap(),
})

export const displayList = (list?: List) => list?.title || "[no name]"

export class ListSearch extends SearchHelper<List, string> {
  config = {keys: ["title", "description"]}
  getValue = (option: List) => getAddress(option.event)
  display = (address: string) =>
    displayList(this.options.find(list => this.getValue(list) === address))
}
