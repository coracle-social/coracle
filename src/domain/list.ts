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
import {EventQuery, KindFactory, ListReader, ListWriter} from "@welshman/domain"
import {reader, writer} from "src/engine/core"
import {makeSearch} from "src/util/misc"

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

export class UserListReader extends ListReader {
  title() {
    return tagValue(tagSpec("title"), this.publicTags) || tagValue(tagSpec("name"), this.publicTags)
  }

  description() {
    return tagValue(tagSpec("description"), this.publicTags)
  }
}

export class UserListWriter extends ListWriter<UserListReader> {
  protected async renderRoutes() {
    // A list is the author's own data, so it goes to their outbox and nowhere else
    return [userOutbox()]
  }

  setTitle(title: string) {
    return this.dropPublic(t => ["title", "name", "alt"].includes(t[0])).addPublic(
      ["title", title],
      ["alt", title],
    )
  }

  setDescription(description: string) {
    return this.dropPublic(spec(["description"])).addPublic(["description", description])
  }
}

export class UserListQuery extends EventQuery {
  protected renderRoutes() {
    // A list is the author's own data, so it comes from their outbox and nowhere else
    return this.authorRoutes()
  }
}

const kindFactories = new Map<number, KindFactory<UserListReader, UserListWriter, UserListQuery>>()

export const userListKind = (kind: number) => {
  let factory = kindFactories.get(kind)

  if (!factory) {
    kindFactories.set(
      kind,
      (factory = new KindFactory({
        kind,
        reader: UserListReader,
        writer: UserListWriter,
        query: UserListQuery,
      })),
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

export const userListWriter = ({kind, title, description, identifier, tags, reader}: UserList) =>
  writer(userListKind(kind), reader)
    .dropPublic(() => true)
    .addPublic(...tags.filter(t => !META_TAG_NAMES.includes(t[0])))
    .setIdentifier(identifier)
    .setTitle(title)
    .setDescription(description)

export const displayUserList = (list?: UserList) =>
  list?.title || listKindLabels.get(list?.kind) || "[no name]"

export const makeUserListSearch = (lists: UserList[]) =>
  makeSearch<string, UserList>(lists, {
    getValue: (list: UserList) => getAddress(list.event),
    fuseOptions: {keys: ["title", "description", "identifier"]},
    displayValue: (address: string, list?: UserList) => displayUserList(list),
  })
