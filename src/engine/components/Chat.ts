import {find, last, pick, uniq, pluck} from "ramda"
import {tryJson, fuzzy, now} from "src/util/misc"
import {Tags, appDataKeys, channelAttrs} from "src/util/nostr"
import type {Channel, Message} from "src/engine/types"
import {collection, derived} from "../util/store"

const getHints = e => pluck("url", Tags.from(e).relays())

const messageIsNew = ({last_checked, last_received, last_sent}: Channel) =>
  last_received > Math.max(last_sent || 0, last_checked || 0)

export class Chat {
  static contributeState() {
    const channels = collection<Channel>()
    const messages = collection<Message>()

    const hasNewMessages = derived(
      channels,
      find(e => {
        return e.type === "public" && e.joined > 0 && messageIsNew(e)
      })
    )

    return {channels, messages, hasNewMessages}
  }

  static contributeSelectors({Chat}) {
    const searchChannels = Chat.channels.derived($channels => {
      return fuzzy($channels, {
        keys: ["name", {name: "about", weight: 0.5}],
        threshold: 0.3,
      })
    })

    return {messageIsNew, searchChannels}
  }

  static initialize({Events, Chat, Keys, Crypt}) {
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
        pubkey: e.pubkey,
        updated_at: now(),
        hints: getHints(e),
        ...content,
      })
    })

    Events.addHandler(30078, async e => {
      if (Tags.from(e).getMeta("d") === appDataKeys.NIP28_LAST_CHECKED) {
        await tryJson(async () => {
          const payload = await Crypt.decryptJson(e.content)

          for (const key of Object.keys(payload)) {
            // Backwards compat from when we used to prefix id/pubkey
            const id = last(key.split("/"))
            const channel = Chat.channels.getKey(id)
            const last_checked = Math.max(payload[id], channel?.last_checked || 0)

            // A bunch of junk got added to this setting. Integer keys, settings, etc
            if (isNaN(last_checked) || last_checked < 1577836800) {
              continue
            }

            Chat.channels.mergeKey(id, {id, last_checked})
          }
        })
      }
    })

    Events.addHandler(30078, async e => {
      if (Tags.from(e).getMeta("d") === appDataKeys.NIP28_ROOMS_JOINED) {
        await tryJson(async () => {
          const channelIds = await Crypt.decryptJson(e.content)

          // Just a bug from when I was building the feature, remove someday
          if (!Array.isArray(channelIds)) {
            return
          }

          Chat.channels.get().forEach(channel => {
            if (channel.joined && !channelIds.includes(channel.id)) {
              Chat.channels.mergeKey(channel.id, {joined: false})
            } else if (!channel.joined && channelIds.includes(channel.id)) {
              Chat.channels.mergeKey(channel.id, {joined: true})
            }
          })
        })
      }
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
        last_sent: e.created_at,
        hints,
      })
    })
  }
}
