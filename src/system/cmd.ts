import {last, pick, uniqBy} from "ramda"
import {doPipe} from "hurdak/lib/hurdak"
import {Tags, channelAttrs, findRoot, findReply} from "src/util/nostr"
import {parseContent} from "src/util/notes"

export default ({routing, displayPubkey}) => {
  const authenticate = (url, challenge) =>
    createEvent(22242, {
      tags: [
        ["challenge", challenge],
        ["relay", url],
      ],
    })

  const updateUser = updates => createEvent(0, {content: JSON.stringify(updates)})

  const setRelays = newRelays =>
    createEvent(10002, {
      tags: newRelays.map(r => {
        const t = ["r", r.url]

        if (!r.write) {
          t.push("read")
        }

        return t
      }),
    })

  const setAppData = (d, content = "") => createEvent(30078, {content, tags: [["d", d]]})

  const setPetnames = petnames => createEvent(3, {tags: petnames})

  const setMutes = mutes => createEvent(10000, {tags: mutes})

  const createList = list => createEvent(30001, {tags: list})

  const createChannel = channel =>
    createEvent(40, {content: JSON.stringify(pick(channelAttrs, channel))})

  const updateChannel = ({id, ...channel}) =>
    createEvent(41, {
      content: JSON.stringify(pick(channelAttrs, channel)),
      tags: [["e", id]],
    })

  const createChatMessage = (channelId, content, url) =>
    createEvent(42, {content, tags: [["e", channelId, url, "root"]]})

  const createDirectMessage = (pubkey, content) => createEvent(4, {content, tags: [["p", pubkey]]})

  const createNote = (content, tags = []) =>
    createEvent(1, {content, tags: uniqTags(tagsFromContent(content, tags))})

  const createReaction = (note, content) => createEvent(7, {content, tags: getReplyTags(note)})

  const createReply = (note, content, tags = []) =>
    createEvent(1, {
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

    return createEvent(9734, {content, tags, tagClient: false})
  }

  const deleteEvents = ids => createEvent(5, {tags: ids.map(id => ["e", id])})

  const deleteNaddrs = naddrs => createEvent(5, {tags: naddrs.map(naddr => ["a", naddr])})

  const createLabel = payload => createEvent(1985, payload)

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

  const createEvent = (kind, {content = "", tags = [], tagClient = true}) => {
    if (tagClient) {
      tags = tags.filter(t => t[0] !== "client").concat([["client", "coracle"]])
    }

    return {kind, content, tags}
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
  }
}
