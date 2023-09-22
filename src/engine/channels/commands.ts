import {generatePrivateKey} from "nostr-tools"
import {assoc, assocPath, path, prop, fromPairs, pluck, whereEq, when, map} from "ramda"
import {createMapOf} from "hurdak"
import {now} from "src/util/misc"
import {appDataKeys} from "src/util/nostr"
import {EventKind} from "src/engine/events/model"
import {Publisher, publishEvent, mention} from "src/engine/network/utils"
import {selectHints, getInboxHints, getPubkeyHints} from "src/engine/relays/utils"
import {user, nip04, nip59} from "src/engine/session/derived"
import {setAppData} from "src/engine/session/commands"
import {channels} from "./state"

export const publishNip04Message = async (recipient, content, tags = [], relays = null) => {
  const pubkeys = [recipient, user.get().pubkey]

  return publishEvent(EventKind.Nip04Message, {
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

export const publishNip28ChannelCreate = content =>
  publishEvent(40, {content: JSON.stringify(content)})

export const publishNip28ChannelUpdate = (id, content) =>
  publishEvent(41, {content: JSON.stringify(content), tags: [["e", id]]})

export const publishNip28Message = (id, content) => {
  const channel = channels.key(id).get()
  const [hint] = selectHints(channel?.relays || [])

  return publishEvent(42, {content, tags: [["e", id, hint, "root"]]})
}

export const publishNip28ChannelChecked = (id: string) => {
  const lastChecked = fromPairs(
    channels
      .get()
      .filter(prop("last_checked"))
      .map(r => [r.id, r.last_checked])
  )

  return setAppData(appDataKeys.NIP28_LAST_CHECKED, {...lastChecked, [id]: now()})
}

export const saveNip28Channels = () =>
  setAppData(
    appDataKeys.NIP28_ROOMS_JOINED,
    pluck("id", channels.get().filter(path(["nip28", "joined"])))
  )

export const joinNip28Channel = (id: string) => {
  channels.key(id).update(assocPath(["nip28", "joined"], true))

  return saveNip28Channels()
}

export const leaveNip28Channel = (id: string) => {
  channels.key(id).update(assocPath(["nip28", "joined"], false))

  return saveNip28Channels()
}
