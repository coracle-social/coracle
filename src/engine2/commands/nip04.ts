import {assoc, whereEq, when, map} from "ramda"
import {createMapOf} from "hurdak"
import {now} from "src/util/misc"
import {appDataKeys} from "src/util/nostr"
import {EventKind} from "src/engine2/model"
import {channels} from "src/engine2/state"
import {user, nip04, getInboxHints, getSetting} from "src/engine2/queries"
import {setAppData} from "./nip78"
import {publishEvent} from "./util"

export const publishNip04Message = async (recipient, content, tags = [], relays = null) => {
  const pubkeys = [recipient, user.get().pubkey]

  return publishEvent(EventKind.Nip04Message, {
    relays: relays || getInboxHints(getSetting("relay_limit"), pubkeys),
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
