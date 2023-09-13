import {assoc, when, whereEq, map} from "ramda"
import {createMapOf} from "hurdak"
import {generatePrivateKey} from "nostr-tools"
import {now} from "src/util/misc"
import {appDataKeys} from "src/util/nostr"
import {channels} from "src/engine2/state"
import {user, nip59, getPubkeyHints} from "src/engine2/queries"
import {setAppData} from "./nip78"
import {Publisher} from "./publisher"
import {mention} from "./util"

export const createNip24Message = (channelId, content) => {
  const recipients = channelId.split(",")
  const template = {kind: 14, content, tags: recipients.map(mention)}

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
