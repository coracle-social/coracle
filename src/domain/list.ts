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
  NAMED_COMMUNITIES,
  MUTES,
  PINS,
  RELAYS,
  BOOKMARKS,
  COMMUNITIES,
  CHANNELS,
  BLOCKED_RELAYS,
  SEARCH_RELAYS,
  ROOMS,
  TOPICS,
  getAddress,
} from "@welshman/util"
import {SearchHelper} from "src/util/misc"

export const FOLLOW_PACK = 39089

export const CUSTOM_LIST_KINDS = [
  FOLLOWS,
  FOLLOW_PACK,
  NAMED_PEOPLE,
  NAMED_RELAYS,
  NAMED_CURATIONS,
  NAMED_WIKI_AUTHORS,
  NAMED_WIKI_RELAYS,
  NAMED_EMOJIS,
  NAMED_TOPICS,
  NAMED_ARTIFACTS,
  NAMED_COMMUNITIES,
  MUTES,
  PINS,
  RELAYS,
  BOOKMARKS,
  COMMUNITIES,
  CHANNELS,
  BLOCKED_RELAYS,
  SEARCH_RELAYS,
  ROOMS,
  TOPICS,
]

export const EDITABLE_LIST_KINDS = [NAMED_PEOPLE, NAMED_RELAYS, NAMED_CURATIONS, NAMED_TOPICS]

export type UserList = {
  kind: number
  title: string
  description: string
  identifier: string
  tags: string[][]
  event?: TrustedEvent
}

export type PublishedUserList = Omit<UserList, "event"> & {
  event: TrustedEvent
}

export const makeUserList = (list: Partial<UserList> = {}): UserList => ({
  kind: NAMED_PEOPLE,
  title: "",
  description: "",
  identifier: randomId(),
  tags: [],
  ...list,
})

export const readUserList = (event: TrustedEvent) => {
  const {
    d: identifier = randomId(),
    name = "",
    title = "",
    description = "",
  } = fromPairs(event.tags)

  return {
    kind: event.kind,
    title: title || name,
    description,
    identifier,
    tags: event.tags,
    event,
  } as PublishedUserList
}

export const createUserList = ({kind, title, description, identifier, tags}: UserList) => {
  const data = {title, alt: title, d: identifier, description}

  return {kind, content: "", tags: tags.filter(t => !data[t[0]]).concat(Object.entries(data))}
}

export const editUserList = ({kind, title, description, identifier, tags}: UserList) => {
  const data = {title, alt: title, d: identifier, description}

  return {kind, content: "", tags: tags.filter(t => !data[t[0]]).concat(Object.entries(data))}
}

export const displayUserList = (list?: UserList) => {
  if (list) {
    if (list.title) return list.title
    if (list.kind === FOLLOWS) return "[follows list]"
    if (list.kind === FOLLOW_PACK) return "[follow pack]"
    if (list.kind === NAMED_PEOPLE) return "[named people list]"
    if (list.kind === NAMED_RELAYS) return "[named relays list]"
    if (list.kind === NAMED_CURATIONS) return "[named curations list]"
    if (list.kind === NAMED_WIKI_AUTHORS) return "[named wiki authors list]"
    if (list.kind === NAMED_WIKI_RELAYS) return "[named wiki relays list]"
    if (list.kind === NAMED_EMOJIS) return "[named emojis list]"
    if (list.kind === NAMED_TOPICS) return "[named topics list]"
    if (list.kind === NAMED_ARTIFACTS) return "[named artifacts list]"
    if (list.kind === NAMED_COMMUNITIES) return "[named communities list]"
    if (list.kind === MUTES) return "[mutes list]"
    if (list.kind === PINS) return "[pins list]"
    if (list.kind === RELAYS) return "[relays list]"
    if (list.kind === BOOKMARKS) return "[bookmarks list]"
    if (list.kind === COMMUNITIES) return "[communities list]"
    if (list.kind === CHANNELS) return "[channels list]"
    if (list.kind === BLOCKED_RELAYS) return "[blocked relays list]"
    if (list.kind === SEARCH_RELAYS) return "[search relays list]"
    if (list.kind === ROOMS) return "[rooms list]"
    if (list.kind === TOPICS) return "[topics list]"
  }

  return "[no name]"
}

export class UserListSearch extends SearchHelper<UserList, string> {
  config = {keys: ["title", "description", "identifier"]}
  getValue = (option: UserList) => getAddress(option.event)
  displayValue = (address: string) => displayUserList(this.getOption(address))
}
