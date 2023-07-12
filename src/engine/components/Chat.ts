import {last, propEq, pick, uniq, pluck} from "ramda"
import {tryJson, now, tryFunc} from "src/util/misc"
import {Tags, channelAttrs} from "src/util/nostr"
import type {Channel, Message} from "src/system/types"
import {collection, derived} from "../util/store"

const getHints = e => pluck("url", Tags.from(e).relays())

const messageIsNew = ({last_checked, last_received, last_sent}: Channel) =>
  last_received > Math.max(last_sent || 0, last_checked || 0)

export function contributeState() {
  const channels = collection<Channel>
  const messages = collection<Message>

  const hasNewDirectMessages = derived(channels, $channels =>
    $channels.entries().filter(e => {
      return e.type === "private" && e.last_sent > 0 && messageIsNew(e)
    })
  )

  const hasNewChatMessages = derived(channels, $channels =>
    $channels.entries().filter(e => {
      return e.type === "public" && e.joined > 0 && messageIsNew(e)
    })
  )

  return {channels, messages, hasNewDirectMessages, hasNewChatMessages}
}

export function initialize({Events, Chat, Keys, Crypt}) {
  Events.addHandler(40, e => {
    const channel = Chat.channels.getKey(e.id)

    if (e.created_at < channel?.updated_at) {
      return
    }

    const content = tryJson(() => pick(channelAttrs, JSON.parse(e.content)))

    if (!content?.name) {
      return
    }

    Chat.channels.mergeKey(e.id, {
      id: e.id,
      type: "public",
      pubkey: e.pubkey,
      updated_at: now(),
      hints: getHints(e),
      ...content,
    })
  })

  Events.addHandler(41, e => {
    const channelId = Tags.from(e).getMeta("e")

    if (!channelId) {
      return
    }

    const channel = Chat.channels.getKey(channelId)

    if (e.created_at < channel?.updated_at) {
      return
    }

    if (e.pubkey !== channel?.pubkey) {
      return
    }

    const content = tryJson(() => pick(channelAttrs, JSON.parse(e.content)))

    if (!content?.name) {
      return
    }

    Chat.channels.mergeKey(channelId, {
      id: channelId,
      type: "public",
      pubkey: e.pubkey,
      updated_at: now(),
      hints: getHints(e),
      ...content,
    })
  })

  Events.addHandler(30078, async e => {
    if (Tags.from(e).getMeta("d") === "coracle/last_checked/v1") {
      await tryJson(async () => {
        const payload = await Crypt.decryptJson(e.content)

        for (const key of Object.keys(payload)) {
          // Backwards compat from when we used to prefix id/pubkey
          const channelId = last(key.split("/"))
          const channel = Chat.channels.getKey(channelId)
          const last_checked = Math.max(payload[channelId], channel?.last_checked || 0)

          // A bunch of junk got added to this setting. Integer keys, settings, etc
          if (isNaN(last_checked) || last_checked < 1577836800) {
            continue
          }

          Chat.channels.mergeKey(channelId, {last_checked})
        }
      })
    }
  })

  Events.addHandler(30078, async e => {
    if (Tags.from(e).getMeta("d") === "coracle/rooms_joined/v1") {
      await tryJson(async () => {
        const channelIds = await Crypt.decryptJson(e.content)

        // Just a bug from when I was building the feature, remove someday
        if (!Array.isArray(channelIds)) {
          return
        }

        Chat.channels.filter(propEq("type", "public")).forEach(channel => {
          if (channel.joined && !channelIds.includes(channel.id)) {
            Chat.channels.mergeKey(channel.id, {joined: false})
          } else if (!channel.joined && channelIds.includes(channel.id)) {
            Chat.channels.mergeKey(channel.id, {joined: true})
          }
        })
      })
    }
  })

  Events.addHandler(4, async e => {
    if (!Keys.canSign.get()) {
      return
    }

    const author = e.pubkey
    const recipient = Tags.from(e).type("p").values().first()

    if (![author, recipient].includes(Keys.pubkey.get())) {
      return
    }

    if (Chat.messages.getKey(e.id)) {
      return
    }

    await tryFunc(async () => {
      const other = Keys.pubkey.get() === author ? recipient : author

      Chat.messages.setKey(e.id, {
        id: e.id,
        channel: other,
        pubkey: e.pubkey,
        created_at: e.created_at,
        content: await Crypt.decrypt(other, e.content),
        tags: e.tags,
      })

      if (Keys.pubkey.get() === author) {
        const channel = Chat.channels.getKey(recipient)

        Chat.channels.mergeKey(recipient, {
          id: recipient,
          type: "private",
          last_sent: e.created_at,
          hints: uniq(getHints(e).concat(channel?.hints || [])),
        })
      } else {
        const channel = Chat.channels.getKey(author)

        Chat.channels.mergeKey(author, {
          id: author,
          type: "private",
          last_received: e.created_at,
          hints: uniq(getHints(e).concat(channel?.hints || [])),
        })
      }
    })
  })

  Events.addHandler(42, e => {
    if (Chat.messages.getKey(e.id)) {
      return
    }

    const tags = Tags.from(e)
    const channelId = tags.getMeta("e")
    const channel = Chat.channels.getKey(channelId)
    const hints = uniq(pluck("url", tags.relays()).concat(channel?.hints || []))

    Chat.messages.mergeKey(e.id, {
      id: e.id,
      channel: channelId,
      pubkey: e.pubkey,
      created_at: e.created_at,
      content: e.content,
      tags: e.tags,
    })

    Chat.channels.mergeKey(channelId, {
      id: channelId,
      type: "public",
      last_sent: e.created_at,
      hints,
    })
  })
}
