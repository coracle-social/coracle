import {randomId, spec} from "@welshman/lib"
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
  FOLLOW_PACK,
  getAddress,
  tagSpec,
  tagValue,
  userOutbox,
} from "@welshman/util"
import {KindFactory, ListReader, ListWriter} from "@welshman/domain"
import {reader, writer} from "src/engine/core"
import {SearchHelper} from "src/util/misc"

// Every nip 51 kind coracle lets a user name, paired with the label shown when a list of that kind
// carries no title of its own.
const LIST_KIND_LABELS: [number, string][] = [
  [FOLLOWS, "[follows list]"],
  [FOLLOW_PACK, "[follow pack]"],
  [NAMED_PEOPLE, "[named people list]"],
  [NAMED_RELAYS, "[named relays list]"],
  [NAMED_CURATIONS, "[named curations list]"],
  [NAMED_WIKI_AUTHORS, "[named wiki authors list]"],
  [NAMED_WIKI_RELAYS, "[named wiki relays list]"],
  [NAMED_EMOJIS, "[named emojis list]"],
  [NAMED_TOPICS, "[named topics list]"],
  [NAMED_ARTIFACTS, "[named artifacts list]"],
  [NAMED_COMMUNITIES, "[named communities list]"],
  [MUTES, "[mutes list]"],
  [PINS, "[pins list]"],
  [RELAYS, "[relays list]"],
  [BOOKMARKS, "[bookmarks list]"],
  [COMMUNITIES, "[communities list]"],
  [CHANNELS, "[channels list]"],
  [BLOCKED_RELAYS, "[blocked relays list]"],
  [SEARCH_RELAYS, "[search relays list]"],
  [ROOMS, "[rooms list]"],
  [TOPICS, "[topics list]"],
]

const listKindLabels = new Map(LIST_KIND_LABELS)

export const CUSTOM_LIST_KINDS = LIST_KIND_LABELS.map(([kind]) => kind)

export const EDITABLE_LIST_KINDS = [NAMED_PEOPLE, NAMED_RELAYS, NAMED_CURATIONS, NAMED_TOPICS]

// Coracle lets the user name a list of any nip 51 kind, including the many @welshman/domain doesn't
// model individually, so it needs one generic pair on top of ListReader's public/private tag
// handling rather than a class per kind.
export class UserListReader extends ListReader {
  title() {
    return tagValue(tagSpec("title"), this.publicTags) || tagValue(tagSpec("name"), this.publicTags)
  }

  description() {
    return tagValue(tagSpec("description"), this.publicTags)
  }
}

export class UserListWriter extends ListWriter<UserListReader> {
  // A list is the author's own data, so it goes to their outbox and nowhere else — the default
  // would fan a people list out to every member's inbox
  protected async renderRoutes() {
    return [userOutbox()]
  }

  setTitle(title: string) {
    // Coracle has always mirrored the title into alt so nip 31 clients have something to show
    return this.dropPublic(t => ["title", "name", "alt"].includes(t[0])).addPublic(
      ["title", title],
      ["alt", title],
    )
  }

  setDescription(description: string) {
    return this.dropPublic(spec(["description"])).addPublic(["description", description])
  }
}

const kindFactories = new Map<number, KindFactory<UserListReader, UserListWriter>>()

// Memoized per kind, since Domain caches its configuration per factory instance
export const userListKind = (kind: number) => {
  let factory = kindFactories.get(kind)

  if (!factory) {
    kindFactories.set(
      kind,
      (factory = new KindFactory({kind, reader: UserListReader, writer: UserListWriter})),
    )
  }

  return factory
}

export type UserList = {
  kind: number
  title: string
  description: string
  identifier: string
  // Public tags only. Private ones stay on the reader, so editing a list can't leak them.
  tags: string[][]
  event?: TrustedEvent
  reader?: UserListReader
}

export type PublishedUserList = Omit<UserList, "event" | "reader"> & {
  event: TrustedEvent
  reader: UserListReader
}

export const makeUserList = (list: Partial<UserList> = {}): UserList => ({
  kind: NAMED_PEOPLE,
  title: "",
  description: "",
  identifier: randomId(),
  tags: [],
  ...list,
})

// Async, because a list reader decrypts its private tags. Without the author's own signer it
// silently yields only the public ones, which is all coracle displays anyway.
export const readUserList = async (event: TrustedEvent): Promise<PublishedUserList> => {
  const listReader = await reader(userListKind(event.kind))(event)

  return {
    kind: event.kind,
    title: listReader.title() || "",
    description: listReader.description() || "",
    identifier: listReader.identifier() || randomId(),
    tags: listReader.publicTags,
    event,
    reader: listReader,
  }
}

const META_TAG_NAMES = ["d", "title", "name", "alt", "description"]

// A writer for creating or editing a list; pass it to `command` to publish. The list's tags replace
// the event's public ones, while any private tags the reader carries are preserved.
export const userListWriter = ({kind, title, description, identifier, tags, reader}: UserList) =>
  writer(userListKind(kind), reader)
    .dropPublic(() => true)
    .addPublic(...tags.filter(t => !META_TAG_NAMES.includes(t[0])))
    .setIdentifier(identifier)
    .setTitle(title)
    .setDescription(description)

export const displayUserList = (list?: UserList) =>
  list?.title || listKindLabels.get(list?.kind) || "[no name]"

export class UserListSearch extends SearchHelper<UserList, string> {
  config = {keys: ["title", "description", "identifier"]}
  getValue = (option: UserList) => getAddress(option.event)
  displayValue = (address: string) => displayUserList(this.getOption(address))
}
