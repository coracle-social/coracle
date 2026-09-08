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
} from "@welshman/util"
import type {RelaySelection, TrustedEvent} from "@welshman/util"
import {
  getCommentTagValues,
  getCommentTags,
  getReplyTagValues,
  getReplyTags,
} from "@welshman/domain"
import type {CommentWriter} from "@welshman/domain"

// Ancestors

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

const ROOT_TAG_NAMES = ["K", "E", "A", "I", "P"]

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

  writer.setRoot(
    // Threads are usually homogeneous, so fall back to the parent's kind
    address?.kind ?? root?.kind ?? parent.kind,
    eventTag?.[1] || "",
    address?.pubkey || root?.pubkey || eventTag?.[4] || "",
    address?.identifier || (root && getIdentifier(root)),
  )

  writer.rootTags = writer.rootTags.filter(t => t[1])

  return writer
}

export const setCommentAncestors = (
  writer: CommentWriter,
  parent: TrustedEvent,
  getEvent: GetEvent = () => undefined,
) => {
  const inherited = parent.tags.filter(t => ROOT_TAG_NAMES.includes(t[0]))

  if (inherited.length > 0) {
    writer.rootTags = inherited
  } else {
    setDerivedRoot(writer, parent, getEvent)
  }

  return writer.setParentFromEvent(parent)
}

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
