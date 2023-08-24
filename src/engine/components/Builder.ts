import {last, pick, uniqBy} from "ramda"
import {doPipe, first} from "hurdak"
import {Tags, channelAttrs, findRoot, findReply} from "src/util/nostr"
import {parseContent} from "src/util/notes"
import type {Event, RelayPolicyEntry} from "src/engine/types"
import type {Engine} from "src/engine/Engine"

type EventOpts = {
  content?: string
  tags?: string[][]
  tagClient?: boolean
}

const uniqTags = uniqBy((t: string[]) => t.slice(0, 2).join(":"))

const buildEvent = (kind: number, {content = "", tags = [], tagClient = true}: EventOpts) => {
  if (tagClient) {
    tags = tags.filter((t: string[]) => t[0] !== "client").concat([["client", "coracle"]])
  }

  return {kind, content, tags}
}

export class Builder {
  engine: Engine

  getEventHint = (event: Event) => first(this.engine.Nip65.getEventHints(1, event)) || ""

  getPubkeyHint = (pubkey: string): string =>
    first(this.engine.Nip65.getPubkeyHints(1, pubkey, "write")) || ""

  getPubkeyPetname = (pubkey: string) => {
    const profile = this.engine.Directory.getProfile(pubkey)

    return profile ? this.engine.Directory.displayProfile(profile) : ""
  }

  mention = (pubkey: string): string[] => {
    const hint = this.getPubkeyHint(pubkey)
    const petname = this.getPubkeyPetname(pubkey)

    return ["p", pubkey, hint, petname]
  }

  tagsFromContent = (content: string, tags: string[][]) => {
    const seen = new Set(Tags.wrap(tags).values().all())

    for (const {type, value} of parseContent({content, tags: []})) {
      if (type === "topic") {
        tags = tags.concat([["t", value]])
        seen.add(value)
      }

      if (type.match(/nostr:(note|nevent)/) && !seen.has(value.id)) {
        tags = tags.concat([["e", value.id, value.relays?.[0] || "", "mention"]])
        seen.add(value.id)
      }

      if (type.match(/nostr:(nprofile|npub)/) && !seen.has(value.pubkey)) {
        tags = tags.concat([this.mention(value.pubkey)])
        seen.add(value.pubkey)
      }
    }

    return tags
  }

  getReplyTags = (n: Event, inherit = false) => {
    const extra = inherit
      ? Tags.from(n)
          .type("e")
          .reject(t => last(t) === "mention")
          .all()
          .map(t => t.slice(0, 3))
      : []
    const eHint = this.getEventHint(n)
    const reply = ["e", n.id, eHint, "reply"]
    const root = doPipe(findRoot(n) || findReply(n) || reply, [
      t => (t.length < 3 ? t.concat(eHint) : t),
      t => t.slice(0, 3).concat("root"),
    ])

    return [this.mention(n.pubkey), root, ...extra, reply]
  }

  authenticate = (url: string, challenge: string) =>
    buildEvent(22242, {
      tags: [
        ["challenge", challenge],
        ["relay", url],
      ],
    })

  setProfile = (profile: Record<string, any>) => buildEvent(0, {content: JSON.stringify(profile)})

  setRelays = (relays: RelayPolicyEntry[]) =>
    buildEvent(10002, {
      tags: relays.map(r => {
        const t = ["r", r.url]

        if (!r.write) {
          t.push("read")
        }

        return t
      }),
    })

  setAppData = (d: string, content = "") => buildEvent(30078, {content, tags: [["d", d]]})

  setPetnames = (petnames: string[][]) => buildEvent(3, {tags: petnames})

  setMutes = (mutes: string[][]) => buildEvent(10000, {tags: mutes})

  createList = (list: string[][]) => buildEvent(30001, {tags: list})

  createChannel = (channel: Record<string, any>) =>
    buildEvent(40, {content: JSON.stringify(pick(channelAttrs, channel))})

  updateChannel = ({id, ...channel}: Record<string, any>) =>
    buildEvent(41, {
      content: JSON.stringify(pick(channelAttrs, channel)),
      tags: [["e", id]],
    })

  createChatMessage = (channelId: string, content: string, url: string) =>
    buildEvent(42, {content, tags: [["e", channelId, url, "root"]]})

  createDirectMessage = (pubkey: string, content: string) =>
    buildEvent(4, {content, tags: [["p", pubkey]]})

  createNote = (content: string, tags: string[][] = []) =>
    buildEvent(1, {content, tags: uniqTags(this.tagsFromContent(content, tags))})

  createReaction = (note: Event, content: string) =>
    buildEvent(7, {content, tags: this.getReplyTags(note)})

  createReply = (note: Event, content: string, tags: string[][] = []) =>
    buildEvent(1, {
      content,
      tags: doPipe(tags, [
        tags => tags.concat(this.getReplyTags(note, true)),
        tags => this.tagsFromContent(content, tags),
        uniqTags,
      ]),
    })

  requestZap = (
    relays: string[],
    content: string,
    pubkey: string,
    eventId: string,
    amount: number,
    lnurl: string
  ) => {
    const tags = [
      ["relays", ...relays],
      ["amount", amount.toString()],
      ["lnurl", lnurl],
      ["p", pubkey],
    ]

    if (eventId) {
      tags.push(["e", eventId])
    }

    return buildEvent(9734, {content, tags, tagClient: false})
  }

  deleteEvents = (ids: string[]) => buildEvent(5, {tags: ids.map(id => ["e", id])})

  deleteNaddrs = (naddrs: string[]) => buildEvent(5, {tags: naddrs.map(naddr => ["a", naddr])})

  createLabel = (payload: EventOpts) => buildEvent(1985, payload)

  nip98Auth = (tags: string[][]) => buildEvent(27235, {tags})

  initialize(engine: Engine) {
    this.engine = engine
  }
}
