import {getIdAndAddress, Tags} from "@welshman/util"
import type {TrustedEvent} from "@welshman/util"
import {uniqBy} from "ramda"
import {parseContent} from "src/util/notes"
import {hints} from "src/engine/relays/utils"
import {env, pubkey} from "src/engine/session/state"
import {getSetting} from "src/engine/session/utils"
import {displayPubkey} from "src/engine/people/utils"

export const uniqTags = uniqBy((t: string[]) =>
  t[0] === "param" ? t.join(":") : t.slice(0, 2).join(":"),
)

export const mention = (pubkey: string) =>
  hints.tagPubkey(pubkey).append(displayPubkey(pubkey)).valueOf()

export const tagsFromContent = (content: string) => {
  const tags = []

  for (const {type, value} of parseContent({content, tags: []})) {
    if (type === "topic") {
      tags.push(["t", value])
    }

    if (type.match(/nostr:(note|nevent)/)) {
      tags.push(["q", value.id, value.relays?.[0] || ""])
    }

    if (type.match(/nostr:(nprofile|npub)/)) {
      tags.push(mention(value.pubkey))
    }
  }

  return tags
}

export const getReplyTags = (parent: TrustedEvent, inherit = false) => {
  const tags = Tags.fromEvent(parent)
  const replyTagValues = getIdAndAddress(parent)
  const userPubkey = pubkey.get()
  const replyTags = []

  // Mention the parent's author
  if (parent.pubkey !== userPubkey) {
    replyTags.push(mention(parent.pubkey))
  }

  // Inherit p-tag mentions
  if (inherit) {
    for (const pubkey of tags.values("p").valueOf()) {
      if (pubkey !== userPubkey) {
        replyTags.push(mention(pubkey))
      }
    }
  }

  // Based on NIP 10 legacy tags, order is root, mentions, reply
  const {roots, replies, mentions} = tags.ancestors()

  // Root comes first
  if (roots.exists()) {
    for (const t of roots.valueOf()) {
      replyTags.push(t.set(2, hints.EventRoots(parent).getUrl()).set(3, "root").valueOf())
    }
  } else {
    for (const t of replies.valueOf()) {
      replyTags.push(t.set(2, hints.EventParents(parent).getUrl()).set(3, "root").valueOf())
    }
  }

  if (inherit) {
    // Make sure we don't repeat any tag values
    const isRepeated = v => replyTagValues.includes(v) || replyTags.find(t => t[1] === v)

    // Inherit mentions
    for (const t of mentions.valueOf()) {
      if (!isRepeated(t.value())) {
        replyTags.push(t.set(3, "mention").valueOf())
      }
    }

    // Inherit replies if they weren't already included
    if (roots.exists()) {
      for (const t of replies.valueOf()) {
        if (!isRepeated(t.value())) {
          replyTags.push(t.set(3, "mention").valueOf())
        }
      }
    }
  }

  // Add a/e-tags for the parent event
  const mark = replies.exists() ? "reply" : "root"
  for (const t of hints.tagEvent(parent, mark).valueOf()) {
    replyTags.push(t.valueOf())
  }

  return replyTags
}

export const getClientTags = () => {
  if (!getSetting("enable_client_tag")) {
    return []
  }

  const {CLIENT_NAME = "", CLIENT_ID} = env.get()
  const tag = ["client", CLIENT_NAME]

  if (CLIENT_ID) {
    tag.push(CLIENT_ID)
  }

  return [tag]
}
