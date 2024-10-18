import {fromPairs, nthEq} from "@welshman/lib"
import type {TrustedEvent} from "@welshman/util"
import {isSignedEvent} from "@welshman/util"

export type GroupMeta = {
  kind: number
  feeds: string[][]
  relays: string[][]
  moderators: string[][]
  identifier: string
  name: string
  about: string
  banner: string
  image: string
  listing_is_public: boolean
  event?: TrustedEvent
}

export type PublishedGroupMeta = Omit<GroupMeta, "event"> & {
  event: TrustedEvent
}

export const readGroupMeta = (event: TrustedEvent) => {
  const meta = fromPairs(event.tags)

  return {
    event,
    kind: event.kind,
    feeds: event.tags.filter(nthEq(0, "feed")),
    relays: event.tags.filter(nthEq(0, "relay")),
    moderators: event.tags.filter(nthEq(0, "p")),
    identifier: meta.d,
    name: meta.name || "",
    banner: meta.banner || "",
    about: meta.about || meta.description || "",
    image: meta.image || meta.picture || "",
    listing_is_public: isSignedEvent(event),
  } as PublishedGroupMeta
}

export const displayGroupMeta = (meta: GroupMeta) => meta?.name || meta?.identifier || "[no name]"
