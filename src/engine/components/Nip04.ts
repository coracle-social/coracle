import {tryFunc} from "hurdak"
import {find, last, uniq, pluck} from "ramda"
import {tryJson} from "src/util/misc"
import {Tags, appDataKeys} from "src/util/nostr"
import type {Contact, Message} from "src/engine/types"
import {collection, derived} from "../util/store"

const getHints = e => pluck("url", Tags.from(e).relays())

const messageIsNew = ({last_checked, last_received, last_sent}: Contact) =>
  last_received > Math.max(last_sent || 0, last_checked || 0)

export class Nip04 {
  static contributeState() {
    const contacts = collection<Contact>("pubkey")
    const messages = collection<Message>("id")

    const hasNewMessages = derived(
      contacts,
      find(e => e.last_sent > 0 && messageIsNew(e))
    )

    return {contacts, messages, hasNewMessages}
  }

  static contributeSelectors({Nip04, Directory}) {
    const searchContacts = Nip04.messages.derived($messages => {
      const pubkeySet = new Set(pluck("pubkey", $messages))
      const searchProfiles = Directory.searchProfiles.get()

      return q =>
        searchProfiles(q)
          .filter(p => pubkeySet.has(p.pubkey))
          .map(p => Nip04.contacts.key(p.pubkey).get())
    })

    return {messageIsNew, searchContacts}
  }

  static initialize({Events, Nip04, Keys, Crypt}) {
    Events.addHandler(30078, async e => {
      if (Tags.from(e).getMeta("d") === appDataKeys.NIP04_LAST_CHECKED) {
        await tryJson(async () => {
          const payload = await Crypt.decryptJson(e.content)

          for (const key of Object.keys(payload)) {
            // Backwards compat from when we used to prefix id/pubkey
            const pubkey = last(key.split("/"))
            const contact = Nip04.contacts.key(pubkey).get()
            const last_checked = Math.max(payload[pubkey], contact?.last_checked || 0)

            // A bunch of junk got added to this setting. Integer keys, settings, etc
            if (pubkey.length !== 64 || isNaN(last_checked) || last_checked < 1577836800) {
              continue
            }

            Nip04.contacts.key(pubkey).merge({last_checked})
          }
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

      if (Nip04.messages.key(e.id).get()) {
        return
      }

      await tryFunc(async () => {
        const other = Keys.pubkey.get() === author ? recipient : author

        Nip04.messages.key(e.id).set({
          contact: other,
          pubkey: e.pubkey,
          created_at: e.created_at,
          content: await Crypt.decrypt(other, e.content),
          tags: e.tags,
        })

        if (Keys.pubkey.get() === author) {
          const contact = Nip04.contacts.key(recipient).get()

          Nip04.contacts.key(recipient).merge({
            last_sent: e.created_at,
            hints: uniq(getHints(e).concat(contact?.hints || [])),
          })
        } else {
          const contact = Nip04.contacts.key(author).get()

          Nip04.contacts.key(author).merge({
            last_received: e.created_at,
            hints: uniq(getHints(e).concat(contact?.hints || [])),
          })
        }
      })
    })
  }
}
