import {first, nth, nthEq, uniq} from "@welshman/lib"
import {
  Address,
  COMMENT,
  getIdAndAddress,
  getIdentifier,
  hexTags,
  isRelayUrl,
  matchTags,
  outbox,
  relays,
  sortEventsDesc,
} from "@welshman/util"
import type {RelaySelection, TrustedEvent} from "@welshman/util"
import {
  getCommentTagValues,
  getCommentTags,
  getReplyTagValues,
  getReplyTags,
} from "@welshman/domain"
import type {CommentWriter} from "@welshman/domain"

// Re-exported because the components that reach for it go through the src/engine barrel
export {sortEventsDesc}

// Ancestors
//
// Welshman dropped these when it split threading between NIP-10 notes and NIP-22 comments; they're
// still the only kind-agnostic way to ask what an event is a reply to.

export const getAncestorTags = ({kind, tags}: Pick<TrustedEvent, "kind" | "tags">) =>
  kind === COMMENT ? getCommentTags(tags) : getReplyTags(tags)

export const getAncestors = ({kind, tags}: Pick<TrustedEvent, "kind" | "tags">) =>
  kind === COMMENT ? getCommentTagValues(tags) : getReplyTagValues(tags)

export const getParentIdsAndAddrs = (event: TrustedEvent) => {
  const {roots, replies} = getAncestors(event)

  return replies.length > 0 ? replies : roots
}

export const getParentIdOrAddr = (event: TrustedEvent) => first(getParentIdsAndAddrs(event))

export const isChildOf = (child: TrustedEvent, parent: TrustedEvent) => {
  const idsAndAddrs = getParentIdsAndAddrs(child)

  return getIdAndAddress(parent).some(x => idsAndAddrs.includes(x))
}

// Comment ancestors

// Nip 22 scopes comments to the root of the thread using upper-case tags, and to their immediate
// parent using lower-case ones. CommentWriter leaves it to the caller to say which event is the
// root, and naively using the parent is only correct when the parent starts the thread.
const ROOT_TAG_NAMES = ["K", "E", "A", "I", "P"]

// Look up the thread root by id, so we can tag its real kind and author. Callers that have an app
// pass `$app.repository.getEvent`; without one we fall back to what the parent's tags tell us.
export type GetEvent = (id: string) => TrustedEvent | undefined

const setDerivedRoot = (writer: CommentWriter, parent: TrustedEvent, getEvent: GetEvent) => {
  // getReplyTags reports the root as a reply when the parent replies directly to it
  const {roots, replies} = getReplyTags(parent.tags)
  const ancestors = roots.length > 0 ? roots : replies
  const eventTag = ancestors.find(nthEq(0, "e"))
  const addressTag = ancestors.find(nthEq(0, "a"))

  // If the parent doesn't have any ancestors, it's the root itself
  if (!eventTag && !addressTag) {
    return writer.setRootFromEvent(parent)
  }

  const address =
    addressTag && Address.isAddress(addressTag[1]) ? Address.from(addressTag[1]) : undefined
  const root = eventTag ? getEvent(eventTag[1]) : undefined

  // setRoot rebuilds the A tag out of these three, so an address tag wins over anything we found
  // in the repository — the two only disagree when one of them is malformed
  writer.setRoot(
    // Threads are usually homogeneous, so fall back to the parent's kind
    address?.kind ?? root?.kind ?? parent.kind,
    eventTag?.[1] || "",
    address?.pubkey || root?.pubkey || eventTag?.[4] || "",
    address?.identifier || (root && getIdentifier(root)),
  )

  // setRoot always emits E and P; drop them when we don't actually know the value
  writer.rootTags = writer.rootTags.filter(t => t[1])

  return writer
}

// Scope a comment to the thread its parent belongs to: the parent's own root when it has one,
// otherwise the parent itself.
export const setCommentAncestors = (
  writer: CommentWriter,
  parent: TrustedEvent,
  getEvent: GetEvent = () => undefined,
) => {
  // Comments carry their root scope with them, including nip 73 external references that setRoot
  // has no way to express, so inherit it verbatim
  const inherited = parent.tags.filter(t => ROOT_TAG_NAMES.includes(t[0]))

  if (inherited.length > 0) {
    writer.rootTags = inherited
  } else {
    setDerivedRoot(writer, parent, getEvent)
  }

  return writer.setParentFromEvent(parent)
}

// Where to look for an event's ancestors. Welshman's router used to answer this with EventParents
// and EventRoots; the relay-selection DSL has no equivalent, so coracle asks the same question of
// the ancestor tags directly: the ancestors' authors weigh heaviest, then anyone the event mentions,
// then whatever hints the tags themselves carry.
export const getAncestorRelaySelections = (
  event: TrustedEvent,
  scope: "roots" | "replies",
): RelaySelection[] => {
  const ancestorTags = getAncestorTags(event)[scope]
  const mentions = matchTags(hexTags("p"), event.tags)
  const authors = ancestorTags.map(nth(3)).filter(pubkey => pubkey?.length === 64)
  const hints = uniq(
    [...ancestorTags, ...mentions].map(nth(2)).filter(url => url && isRelayUrl(url)),
  )

  return [
    ...authors.map(pubkey => outbox(pubkey, 10)),
    ...mentions.map(nth(1)).map(pubkey => outbox(pubkey)),
    ...relays(hints),
  ]
}
