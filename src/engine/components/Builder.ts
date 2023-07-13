import {last, pick, uniqBy} from "ramda"
import {doPipe, first} from "hurdak/lib/hurdak"
import {Tags, channelAttrs, findRoot, findReply} from "src/util/nostr"
import {parseContent} from "src/util/notes"

const uniqTags = uniqBy(t => t.slice(0, 2).join(":"))

const buildEvent = (kind, {content = "", tags = [], tagClient = true}) => {
  if (tagClient) {
    tags = tags.filter(t => t[0] !== "client").concat([["client", "coracle"]])
  }

  return {kind, content, tags}
}

export class Builder {
  static contributeActions({Nip65, Directory}) {
    const getEventHint = event => first(Nip65.getEventHints(1, event)) || ""

    const getPubkeyHint = pubkey => first(Nip65.getPubkeyHints(1, pubkey)) || ""

    const getPubkeyPetname = pubkey => {
      const profile = Directory.getProfile(pubkey)

      return profile ? Directory.displayProfile(profile) : ""
    }

    const mention = pubkey => {
      const hint = getPubkeyHint(pubkey)
      const petname = getPubkeyPetname(pubkey)

      return ["p", pubkey, hint, petname]
    }

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

    const getReplyTags = (n, inherit = false) => {
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

    const authenticate = (url, challenge) =>
      buildEvent(22242, {
        tags: [
          ["challenge", challenge],
          ["relay", url],
        ],
      })

    const setProfile = profile => buildEvent(0, {content: JSON.stringify(profile)})

    const setRelays = relays =>
      buildEvent(10002, {
        tags: relays.map(r => {
          const t = ["r", r.url]

          if (!r.write) {
            t.push("read")
          }

          return t
        }),
      })

    const setAppData = (d, content = "") => buildEvent(30078, {content, tags: [["d", d]]})

    const setPetnames = petnames => buildEvent(3, {tags: petnames})

    const setMutes = mutes => buildEvent(10000, {tags: mutes})

    const createList = list => buildEvent(30001, {tags: list})

    const createChannel = channel =>
      buildEvent(40, {content: JSON.stringify(pick(channelAttrs, channel))})

    const updateChannel = ({id, ...channel}) =>
      buildEvent(41, {
        content: JSON.stringify(pick(channelAttrs, channel)),
        tags: [["e", id]],
      })

    const createChatMessage = (channelId, content, url) =>
      buildEvent(42, {content, tags: [["e", channelId, url, "root"]]})

    const createDirectMessage = (pubkey, content) => buildEvent(4, {content, tags: [["p", pubkey]]})

    const createNote = (content, tags = []) =>
      buildEvent(1, {content, tags: uniqTags(tagsFromContent(content, tags))})

    const createReaction = (note, content) => buildEvent(7, {content, tags: getReplyTags(note)})

    const createReply = (note, content, tags = []) =>
      buildEvent(1, {
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

      return buildEvent(9734, {content, tags, tagClient: false})
    }

    const deleteEvents = ids => buildEvent(5, {tags: ids.map(id => ["e", id])})

    const deleteNaddrs = naddrs => buildEvent(5, {tags: naddrs.map(naddr => ["a", naddr])})

    const createLabel = payload => buildEvent(1985, payload)

    return {
      mention,
      tagsFromContent,
      getReplyTags,
      authenticate,
      setProfile,
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
}
