import {last, pick, uniqBy} from "ramda"
import {get} from "svelte/store"
import {doPipe} from "hurdak/lib/hurdak"
import {Tags, channelAttrs, findRoot, findReply} from "src/util/nostr"
import {parseContent} from "src/util/notes"

export default ({keys, sync, network, routing, displayPubkey}) => {
  const authenticate = (url, challenge) =>
    new PublishableEvent(22242, {
      tags: [
        ["challenge", challenge],
        ["relay", url],
      ],
    })

  const updateUser = updates => new PublishableEvent(0, {content: JSON.stringify(updates)})

  const setRelays = newRelays =>
    new PublishableEvent(10002, {
      tags: newRelays.map(r => {
        const t = ["r", r.url]

        if (!r.write) {
          t.push("read")
        }

        return t
      }),
    })

  const setAppData = (d, content = "") => new PublishableEvent(30078, {content, tags: [["d", d]]})

  const setPetnames = petnames => new PublishableEvent(3, {tags: petnames})

  const setMutes = mutes => new PublishableEvent(10000, {tags: mutes})

  const createList = list => new PublishableEvent(30001, {tags: list})

  const createChannel = channel =>
    new PublishableEvent(40, {content: JSON.stringify(pick(channelAttrs, channel))})

  const updateChannel = ({id, ...channel}) =>
    new PublishableEvent(41, {
      content: JSON.stringify(pick(channelAttrs, channel)),
      tags: [["e", id]],
    })

  const createChatMessage = (channelId, content, url) =>
    new PublishableEvent(42, {content, tags: [["e", channelId, url, "root"]]})

  const createDirectMessage = (pubkey, content) =>
    new PublishableEvent(4, {content, tags: [["p", pubkey]]})

  const createNote = (content, tags = []) =>
    new PublishableEvent(1, {content, tags: uniqTags(tagsFromContent(content, tags))})

  const createReaction = (note, content) =>
    new PublishableEvent(7, {content, tags: getReplyTags(note)})

  const createReply = (note, content, tags = []) =>
    new PublishableEvent(1, {
      content,
      tags: doPipe(tags, [
        tags => tags.concat(getReplyTags(note, true)),
        tags => tagsFromContent(content, tags),
        uniqTags,
      ]),
    })

  const requestZap = (relays, content, pubkey, eventId, amount, lnurl) => {
    const tags = [
      ["relays", ...relays],
      ["amount", amount.toString()],
      ["lnurl", lnurl],
      ["p", pubkey],
    ]

    if (eventId) {
      tags.push(["e", eventId])
    }

    return new PublishableEvent(9734, {content, tags, tagClient: false})
  }

  const deleteEvents = ids => new PublishableEvent(5, {tags: ids.map(id => ["e", id])})

  const deleteNaddrs = naddrs => new PublishableEvent(5, {tags: naddrs.map(naddr => ["a", naddr])})

  const createLabel = payload => new PublishableEvent(1985, payload)

  // Utils

  const tagsFromContent = (content, tags) => {
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
        tags = tags.concat([mention(value.pubkey)])
        seen.add(value.pubkey)
      }
    }

    return tags
  }

  const mention = pubkey => {
    const name = displayPubkey(pubkey)
    const hint = routing.getPubkeyHint(pubkey) || ""

    return ["p", pubkey, hint, name]
  }

  const getReplyTags = (n, inherit = false) => {
    const extra = inherit
      ? Tags.from(n)
          .type("e")
          .reject(t => last(t) === "mention")
          .all()
          .map(t => t.slice(0, 3))
      : []
    const eHint = routing.getEventHint(n) || ""
    const reply = ["e", n.id, eHint, "reply"]
    const root = doPipe(findRoot(n) || findReply(n) || reply, [
      t => (t.length < 3 ? t.concat(eHint) : t),
      t => t.slice(0, 3).concat("root"),
    ])

    return [mention(n.pubkey), root, ...extra, reply]
  }

  const uniqTags = uniqBy(t => t.slice(0, 2).join(":"))

  class PublishableEvent {
    event: Record<string, any>
    constructor(kind, {content = "", tags = [], tagClient = true}) {
      const pubkey = get(keys.pubkey)
      const createdAt = Math.round(new Date().valueOf() / 1000)

      if (tagClient) {
        tags = tags.filter(t => t[0] !== "client").concat([["client", "coracle"]])
      }

      this.event = {kind, content, tags, pubkey, created_at: createdAt}
    }
    getSignedEvent() {
      try {
        return keys.sign(this.event)
      } catch (e) {
        console.log(this.event)
        throw e
      }
    }
    async publish(relays: string[], onProgress = null, verb = "EVENT") {
      const event = await this.getSignedEvent()
      // return console.log(event)
      const promise = network.publish({relays, event, onProgress, verb})

      // Copy the event since loki mutates it to add metadata
      sync.processEvents({...event, seen_on: []})

      return [event, promise]
    }
  }

  return {
    mention,
    authenticate,
    updateUser,
    setRelays,
    setAppData,
    setPetnames,
    setMutes,
    createList,
    createChannel,
    updateChannel,
    createChatMessage,
    createDirectMessage,
    createNote,
    createReaction,
    createReply,
    requestZap,
    deleteEvents,
    deleteNaddrs,
    createLabel,
    PublishableEvent,
  }
}
