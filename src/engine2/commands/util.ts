import {last, uniqBy} from "ramda"
import {doPipe, first} from "hurdak"
import {Tags, findRoot, findReply} from "src/util/nostr"
import {parseContent} from "src/util/notes"
import {now} from "src/util/misc"
import type {Event} from "src/engine2/model"
import {people} from "src/engine2/state"
import {signer, getUserRelayUrls} from "src/engine2/queries"
import {getEventHints, getPubkeyHints, displayPerson} from "src/engine2/queries"
import {Publisher} from "./publisher"

export type EventOpts = {
  created_at?: number
  content?: string
  tags?: string[][]
}

export const buildEvent = (
  kind: number,
  {content = "", tags = [], created_at = null}: EventOpts
) => {
  return {kind, content, tags, created_at: created_at || now()}
}

export type PublishOpts = EventOpts & {
  relays?: string[]
}

export const publishEvent = async (
  kind: number,
  {relays, content = "", tags = []}: PublishOpts
) => {
  return Publisher.publish({
    timeout: 5000,
    relays: relays || getUserRelayUrls("write"),
    event: await signer.get().signAsUser(
      buildEvent(kind, {
        content,
        tags: uniqTags([...tags, tagsFromContent(content)]),
      })
    ),
  })
}

export const uniqTags = uniqBy((t: string[]) => t.slice(0, 2).join(":"))

export const getEventHint = (event: Event) => first(getEventHints.limit(1).getHints(event)) || ""

export const getPubkeyHint = (pubkey: string): string =>
  first(getPubkeyHints(1, pubkey, "write")) || ""

export const getPubkeyPetname = (pubkey: string) => {
  const person = people.key(pubkey).get()

  return person ? displayPerson(person) : ""
}

export const mention = (pubkey: string): string[] => {
  const hint = getPubkeyHint(pubkey)
  const petname = getPubkeyPetname(pubkey)

  return ["p", pubkey, hint, petname]
}

export const tagsFromContent = (content: string) => {
  const tags = []

  for (const {type, value} of parseContent({content, tags: []})) {
    if (type === "topic") {
      tags.push(["t", value])
    }

    if (type.match(/nostr:(note|nevent)/)) {
      tags.push(["e", value.id, value.relays?.[0] || "", "mention"])
    }

    if (type.match(/nostr:(nprofile|npub)/)) {
      tags.push(mention(value.pubkey))
    }
  }

  return tags
}

export const getReplyTags = (n: Event, inherit = false) => {
  const extra = inherit
    ? Tags.from(n)
        .type("e")
        .reject(t => last(t) === "mention")
        .all()
        .map(t => t.slice(0, 3))
    : []
  const eHint = getEventHint(n)
  const reply = ["e", n.id, eHint, "reply"]
  const root = doPipe(findRoot(n) || findReply(n) || reply, [
    t => (t.length < 3 ? t.concat(eHint) : t),
    t => t.slice(0, 3).concat("root"),
  ])

  return [mention(n.pubkey), root, ...extra, reply]
}
