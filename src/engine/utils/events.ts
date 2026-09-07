import {nthEq, sortBy} from "@welshman/lib"
import {
  Address,
  getAddress,
  getReplyTags,
  isReplaceableKind,
  isShareableRelayUrl,
} from "@welshman/util"
import type {TrustedEvent} from "@welshman/util"
import {Router} from "@welshman/router"
import {repository} from "@welshman/app"

export const sortEventsDesc = events => sortBy((e: TrustedEvent) => -e.created_at, events)

type CommentRoot = {
  kind: number
  pubkey: string
  hint: string
  id?: string
  address?: string
}

// Find the root of the thread the given event belongs to. Comments are handled by the caller,
// since they carry their root scope with them.
const getCommentRoot = (parent: TrustedEvent): CommentRoot => {
  // getReplyTags reports the root as a reply when the parent replies directly to it
  const {roots, replies} = getReplyTags(parent.tags)
  const ancestors = roots.length > 0 ? roots : replies
  const eventTag = ancestors.find(nthEq(0, "e"))
  const addressTag = ancestors.find(nthEq(0, "a"))

  // If the parent doesn't have any ancestors, it's the root itself
  if (!eventTag && !addressTag) {
    return {
      kind: parent.kind,
      pubkey: parent.pubkey,
      hint: Router.get().Event(parent).getUrl() || "",
      id: parent.id,
      address: isReplaceableKind(parent.kind) ? getAddress(parent) : undefined,
    }
  }

  const address =
    addressTag && Address.isAddress(addressTag[1]) ? Address.from(addressTag[1]) : undefined
  const root = eventTag ? repository.getEvent(eventTag[1]) : undefined
  const hint = [eventTag?.[2], addressTag?.[2]].find(url => url && isShareableRelayUrl(url))

  return {
    // Threads are usually homogeneous, so fall back to the parent's kind
    kind: root?.kind ?? address?.kind ?? parent.kind,
    pubkey: root?.pubkey || address?.pubkey || eventTag?.[4] || "",
    hint: hint || Router.get().EventRoots(parent).getUrl() || "",
    id: eventTag?.[1],
    address: addressTag?.[1],
  }
}

const tagCommentRoot = ({kind, pubkey, hint, id, address}: CommentRoot) => {
  const tags = [["K", String(kind)]]

  if (pubkey) {
    tags.push(["P", pubkey, Router.get().FromPubkey(pubkey).getUrl() || ""])
  }

  if (id) {
    tags.push(["E", id, hint, pubkey])
  }

  if (address) {
    tags.push(["A", address, hint, pubkey])
  }

  return tags
}

// Nip 22 scopes comments to the root of the thread using upper-case tags, and to their immediate
// parent using lower-case ones. Welshman's version of this always uses the parent as the root,
// which is only correct when the parent starts the thread.
export const tagEventForComment = (parent: TrustedEvent, relay?: string) => {
  // Comments carry their root scope with them, so inherit it verbatim
  const inherited = parent.tags.filter(t => ["K", "E", "A", "I", "P"].includes(t[0]))
  const tags = inherited.length > 0 ? inherited : tagCommentRoot(getCommentRoot(parent))
  const hint = relay || Router.get().Event(parent).getUrl() || ""

  tags.push(["k", String(parent.kind)])
  tags.push(["p", parent.pubkey, Router.get().FromPubkey(parent.pubkey).getUrl() || ""])
  tags.push(["e", parent.id, hint, parent.pubkey])

  if (isReplaceableKind(parent.kind)) {
    tags.push(["a", getAddress(parent), hint, parent.pubkey])
  }

  return tags
}
