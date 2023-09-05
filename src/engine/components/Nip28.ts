import {find, last, pick, uniq} from "ramda"
import {tryJson, fuzzy} from "src/util/misc"
import {Tags, appDataKeys, channelAttrs} from "src/util/nostr"
import type {Channel, Event, Message} from "src/engine/types"
import type {Engine} from "src/engine/Engine"
import {collection, derived} from "src/engine/util/store"
import type {Readable} from "src/engine/util/store"

const messageIsNew = ({last_checked, last_received, last_sent}: Channel) =>
  last_received > Math.max(last_sent || 0, last_checked || 0)

export class Nip28 {
  channels = collection<Channel>("id")
  messages = collection<Message>("id")

  hasNewMessages = derived(
    this.channels,
    find((c: Channel) => c.joined && messageIsNew(c))
  )

  getSearchChannels = (channels: Readable<Channel[]>) =>
    channels.derived($channels => {
      return fuzzy($channels, {
        keys: ["name", {name: "about", weight: 0.5}],
        threshold: 0.3,
      })
    })

  searchChannels = this.getSearchChannels(this.channels)

  initialize(engine: Engine) {
    engine.Events.addHandler(40, (e: Event) => {
      const channel = this.channels.key(e.id).get()

      if (e.created_at < channel?.updated_at) {
        return
      }

      const content = tryJson(() => pick(channelAttrs, JSON.parse(e.content))) as Partial<Channel>

      if (!content?.name) {
        return
      }

      this.channels.key(e.id).merge({
        ...content,
        pubkey: e.pubkey,
        updated_at: e.created_at,
        hints: Tags.from(e).relays(),
      })
    })

    engine.Events.addHandler(41, (e: Event) => {
      const channelId = Tags.from(e).getMeta("e")

      if (!channelId) {
        return
      }

      const channel = this.channels.key(channelId).get()

      if (e.created_at < channel?.updated_at) {
        return
      }

      if (e.pubkey !== channel?.pubkey) {
        return
      }

      const content = tryJson(() => pick(channelAttrs, JSON.parse(e.content))) as Partial<Channel>

      if (!content?.name) {
        return
      }

      this.channels.key(channelId).merge({
        ...content,
        pubkey: e.pubkey,
        updated_at: e.created_at,
        hints: Tags.from(e).relays(),
      })
    })

    engine.Events.addHandler(30078, async (e: Event) => {
      if (!engine.Keys.canSign.get()) {
        return
      }

      if (Tags.from(e).getMeta("d") === appDataKeys.NIP28_LAST_CHECKED) {
        await tryJson(async () => {
          const payload = await engine.Crypt.decryptJson(e.content)

          for (const key of Object.keys(payload)) {
            // Backwards compat from when we used to prefix id/pubkey
            const id = last(key.split("/"))
            const channel = this.channels.key(id).get()
            const last_checked = Math.max(payload[id], channel?.last_checked || 0)

            // A bunch of junk got added to this setting. Integer keys, settings, etc
            if (isNaN(last_checked) || last_checked < 1577836800) {
              continue
            }

            this.channels.key(id).merge({last_checked})
          }
        })
      }
    })

    engine.Events.addHandler(30078, async (e: Event) => {
      if (!engine.Keys.canSign.get()) {
        return
      }

      if (Tags.from(e).getMeta("d") === appDataKeys.NIP28_ROOMS_JOINED) {
        await tryJson(async () => {
          const channelIds = await engine.Crypt.decryptJson(e.content)

          // Just a bug from when I was building the feature, remove someday
          if (!Array.isArray(channelIds)) {
            return
          }

          this.channels.get().forEach(channel => {
            if (channel.joined && !channelIds.includes(channel.id)) {
              this.channels.key(channel.id).merge({joined: false})
            } else if (!channel.joined && channelIds.includes(channel.id)) {
              this.channels.key(channel.id).merge({joined: true})
            }
          })
        })
      }
    })

    engine.Events.addHandler(42, (e: Event) => {
      if (this.messages.key(e.id).exists()) {
        return
      }

      const tags = Tags.from(e)
      const channelId = tags.getMeta("e")

      if (!channelId) {
        return
      }

      const channel = this.channels.key(channelId).get()
      const hints = uniq(tags.relays().concat(channel?.hints || []))

      this.messages.key(e.id).merge({
        channel: channelId,
        pubkey: e.pubkey,
        created_at: e.created_at,
        content: e.content,
        tags: e.tags,
      })

      if (e.pubkey === engine.Keys.pubkey.get()) {
        this.channels.key(channelId).merge({
          last_sent: Math.max(e.created_at, channel?.last_sent || 0),
          hints,
        })
      } else {
        this.channels.key(channelId).merge({
          last_received: Math.max(e.created_at, channel?.last_received || 0),
          hints,
        })
      }
    })
  }
}
