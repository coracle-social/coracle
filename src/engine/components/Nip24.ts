import {identity, without, sortBy, find, propEq} from "ramda"
import {tryJson} from "src/util/misc"
import {Tags, appDataKeys} from "src/util/nostr"
import type {Nip24Channel, Message} from "src/engine/types"
import type {Engine} from "src/engine/Engine"
import {collection, derived} from "src/engine/util/store"
import {withUnwrappedEvent} from "src/engine/util/giftWrap"

export class Nip24 {
  engine: Engine
  channels = collection<Nip24Channel>("id")
  messages = collection<Message>("id")

  messageIsNew = ({last_checked, last_received, last_sent}: Nip24Channel) =>
    last_received > Math.max(last_sent || 0, last_checked || 0)

  hasNewMessages = derived(
    this.channels,
    find((e: Nip24Channel) => e.last_sent > 0 && this.messageIsNew(e))
  )

  getChannelId = (pubkeys: string[]) => sortBy(identity, pubkeys).join(",")

  initialize(engine: Engine) {
    this.engine = engine

    engine.Events.addHandler(30078, async e => {
      if (!engine.Keys.canSign.get()) {
        return
      }

      if (Tags.from(e).getMeta("d") === appDataKeys.NIP24_LAST_CHECKED) {
        await tryJson(async () => {
          const payload = await engine.Crypt.decryptJson(e.content)

          for (const key of Object.keys(payload)) {
            const channel = this.channels.key(key).get()
            const last_checked = Math.max(payload[key], channel?.last_checked || 0)

            this.channels.key(key).merge({last_checked})
          }
        })
      }
    })

    engine.Events.addHandler(1059, e => {
      const keyState = find(propEq("pubkey", Tags.from(e).getMeta("p")), engine.Keys.keyState.get())

      if (!keyState?.privkey) {
        return
      }

      withUnwrappedEvent(keyState.privkey, e, ({wrap, seal, rumor}) => {
        if (rumor.kind === 14) {
          const tags = Tags.from(rumor)
          const pubkey = engine.Keys.pubkey.get()
          const pubkeys = without([pubkey], tags.type("p").values().all().concat(seal.pubkey))
          const channel = {
            id: this.getChannelId(pubkeys),
            hints: tags.relays(),
          } as Nip24Channel

          if (rumor.pubkey === keyState.pubkey) {
            channel.last_sent = rumor.created_at
          } else {
            channel.last_received = rumor.created_at
          }

          this.channels.key(channel.id).merge(channel)
          this.messages.key(rumor.id).set({...rumor, channel: channel.id})
        }
      })
    })
  }
}
