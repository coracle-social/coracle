import {last, pick, uniqBy} from "ramda"
import {doPipe, first} from "hurdak/lib/hurdak"
import {Tags, channelAttrs, findRoot, findReply} from "src/util/nostr"
import {parseContent} from "src/util/notes"
import type {System} from "src/system/system"

const uniqTags = uniqBy(t => t.slice(0, 2).join(":"))

const buildEvent = (kind, {content = "", tags = [], tagClient = true}) => {
  if (tagClient) {
    tags = tags.filter(t => t[0] !== "client").concat([["client", "coracle"]])
  }

  return {kind, content, tags}
}

export class Builder {
  system: System
  constructor(system) {
    this.system = system
  }
  mention = pubkey => {
    const profile = this.system.directory.getProfile(pubkey)
    const name = profile ? this.system.directory.displayProfile(profile) : ""
    const hint = first(this.system.routing.getPubkeyHints(1, pubkey)) || ""

    return ["p", pubkey, hint, name]
  }
  tagsFromContent(content, tags) {
    const seen = new Set(Tags.wrap(tags).values().all())

    for (const {type, value} of parseContent({content})) {
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
  getReplyTags(n, inherit = false) {
    const extra = inherit
      ? Tags.from(n)
          .type("e")
          .reject(t => last(t) === "mention")
          .all()
          .map(t => t.slice(0, 3))
      : []
    const eHint = first(this.system.routing.getEventHints(1, n)) || ""
    const reply = ["e", n.id, eHint, "reply"]
    const root = doPipe(findRoot(n) || findReply(n) || reply, [
      t => (t.length < 3 ? t.concat(eHint) : t),
      t => t.slice(0, 3).concat("root"),
    ])

    return [this.mention(n.pubkey), root, ...extra, reply]
  }
  authenticate(url, challenge) {
    return buildEvent(22242, {
      tags: [
        ["challenge", challenge],
        ["relay", url],
      ],
    })
  }
  setProfile(profile) {
    return buildEvent(0, {content: JSON.stringify(profile)})
  }
  setRelays(relays) {
    return buildEvent(10002, {
      tags: relays.map(r => {
        const t = ["r", r.url]

        if (!r.write) {
          t.push("read")
        }

        return t
      }),
    })
  }
  setAppData(d, content = "") {
    return buildEvent(30078, {content, tags: [["d", d]]})
  }
  setPetnames(petnames) {
    return buildEvent(3, {tags: petnames})
  }
  setMutes(mutes) {
    return buildEvent(10000, {tags: mutes})
  }
  createList(list) {
    return buildEvent(30001, {tags: list})
  }
  createChannel(channel) {
    return buildEvent(40, {content: JSON.stringify(pick(channelAttrs, channel))})
  }
  updateChannel({id, ...channel}) {
    return buildEvent(41, {
      content: JSON.stringify(pick(channelAttrs, channel)),
      tags: [["e", id]],
    })
  }
  createChatMessage(channelId, content, url) {
    return buildEvent(42, {content, tags: [["e", channelId, url, "root"]]})
  }
  createDirectMessage(pubkey, content) {
    return buildEvent(4, {content, tags: [["p", pubkey]]})
  }
  createNote(content, tags = []) {
    return buildEvent(1, {content, tags: uniqTags(this.tagsFromContent(content, tags))})
  }
  createReaction(note, content) {
    return buildEvent(7, {content, tags: this.getReplyTags(note)})
  }
  createReply(note, content, tags = []) {
    return buildEvent(1, {
      content,
      tags: doPipe(tags, [
        tags => tags.concat(this.getReplyTags(note, true)),
        tags => this.tagsFromContent(content, tags),
        uniqTags,
      ]),
    })
  }
  requestZap(relays, content, pubkey, eventId, amount, lnurl) {
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
  deleteEvents(ids) {
    return buildEvent(5, {tags: ids.map(id => ["e", id])})
  }
  deleteNaddrs(naddrs) {
    return buildEvent(5, {tags: naddrs.map(naddr => ["a", naddr])})
  }
  createLabel(payload) {
    return buildEvent(1985, payload)
  }
}
