import {tryFunc} from "hurdak"
import {find, last, uniq, pluck} from "ramda"
import {tryJson} from "src/util/misc"
import {Tags, appDataKeys} from "src/util/nostr"
import type {Contact, Profile, Message, Event} from "src/engine/types"
import type {Engine} from "src/engine/Engine"
import {collection, derived} from "src/engine/util/store"

const getHints = (e: Event) => pluck("url", Tags.from(e).relays())

const messageIsNew = ({last_checked, last_received, last_sent}: Contact) =>
  last_received > Math.max(last_sent || 0, last_checked || 0)

export class Nip04 {
  engine: Engine
  contacts = collection<Contact>("pubkey")
  messages = collection<Message>("id")

  hasNewMessages = derived(
    this.contacts,
    find((e: Contact) => e.last_sent > 0 && messageIsNew(e))
  )

  searchContacts = this.messages.derived($messages => {
    const pubkeySet = new Set(pluck("pubkey", $messages))
    const searchProfiles = this.engine.components.Directory.searchProfiles.get()

    return (q: string) =>
      searchProfiles(q)
        .filter((p: Profile) => pubkeySet.has(p.pubkey))
        .map((p: Profile) => this.contacts.key(p.pubkey).get())
  })

  initialize(engine: Engine) {
    this.engine = engine

    engine.components.Events.addHandler(30078, async e => {
      if (Tags.from(e).getMeta("d") === appDataKeys.NIP04_LAST_CHECKED) {
        await tryJson(async () => {
          const payload = await engine.components.Crypt.decryptJson(e.content)

          for (const key of Object.keys(payload)) {
            // Backwards compat from when we used to prefix id/pubkey
            const pubkey = last(key.split("/"))
            const contact = this.contacts.key(pubkey).get()
            const last_checked = Math.max(payload[pubkey], contact?.last_checked || 0)

            // A bunch of junk got added to this setting. Integer keys, settings, etc
            if (pubkey.length !== 64 || isNaN(last_checked) || last_checked < 1577836800) {
              continue
            }

            this.contacts.key(pubkey).merge({last_checked})
          }
        })
      }
    })

    engine.components.Events.addHandler(4, async e => {
      if (!engine.components.Keys.canSign.get()) {
        return
      }

      const author = e.pubkey
      const recipient = Tags.from(e).type("p").values().first()

      if (![author, recipient].includes(engine.components.Keys.pubkey.get())) {
        return
      }

      if (this.messages.key(e.id).get()) {
        return
      }

      await tryFunc(async () => {
        const other = engine.components.Keys.pubkey.get() === author ? recipient : author

        this.messages.key(e.id).set({
          id: e.id,
          contact: other,
          pubkey: e.pubkey,
          created_at: e.created_at,
          content: await engine.components.Crypt.decrypt(other, e.content),
          tags: e.tags,
        })

        if (engine.components.Keys.pubkey.get() === author) {
          const contact = this.contacts.key(recipient).get()

          this.contacts.key(recipient).merge({
            last_sent: e.created_at,
            hints: uniq(getHints(e).concat(contact?.hints || [])),
          })
        } else {
          const contact = this.contacts.key(author).get()

          this.contacts.key(author).merge({
            last_received: e.created_at,
            hints: uniq(getHints(e).concat(contact?.hints || [])),
          })
        }
      })
    })
  }
}
