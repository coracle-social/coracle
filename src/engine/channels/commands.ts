import {generatePrivateKey} from "nostr-tools"
import {assoc, whereEq, when, map} from "ramda"
import {createMapOf} from "hurdak"
import {now} from "paravel"
import {appDataKeys} from "src/util/nostr"
import {EventKind} from "src/engine/events/model"
import {Publisher, createAndPublish, mention} from "src/engine/network/utils"
import {getInboxHints, getPubkeyHints} from "src/engine/relays/utils"
import {user, nip04, nip59} from "src/engine/session/derived"
import {setAppData} from "src/engine/session/commands"
import {channels} from "./state"

export const publishNip04Message = async (recipient, content, tags = [], relays = null) => {
  const pubkeys = [recipient, user.get().pubkey]

  return createAndPublish(EventKind.Nip04Message, {
    relays: relays || getInboxHints(pubkeys),
    content: await nip04.get().encryptAsUser(content, recipient),
    tags: [...tags, ["p", recipient]],
  })
}

export const publishNip04Read = () =>
  setAppData(
    appDataKeys.NIP04_LAST_CHECKED,
    createMapOf("id", "last_checked", channels.get().filter(whereEq({type: "nip04"})))
  )

export const nip04MarkAllRead = () => {
  // @ts-ignore
  channels.update(map(when(whereEq({type: "nip04"}), assoc("last_checked", now()))))

  publishNip04Read()
}

export const nip04MarkChannelRead = (pubkey: string) => {
  channels.key(pubkey).update(assoc("last_checked", now()))

  publishNip04Read()
}

export const createNip24Message = (channelId, content) => {
  const recipients = channelId.split(",")
  const template = {
    content,
    kind: 14,
    created_at: now(),
    tags: recipients.map(mention),
  }

  for (const pubkey of recipients.concat(user.get().pubkey)) {
    Publisher.publish({
      relays: getPubkeyHints(pubkey, "read"),
      event: nip59.get().wrap(template, {
        wrap: {
          author: generatePrivateKey(),
          recipient: pubkey,
        },
      }),
    })
  }
}

export const publishNip24Read = () =>
  setAppData(
    appDataKeys.NIP24_LAST_CHECKED,
    createMapOf("id", "last_checked", channels.get().filter(whereEq({type: "nip24"})))
  )

export const nip24MarkAllRead = () => {
  // @ts-ignore
  channels.update(map(when(whereEq({type: "nip24"}), assoc("last_checked", now()))))

  publishNip24Read()
}

export const nip24MarkChannelRead = (pubkey: string) => {
  channels.key(pubkey).update(assoc("last_checked", now()))

  publishNip24Read()
}
