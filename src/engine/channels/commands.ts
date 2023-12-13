import {generatePrivateKey} from "nostr-tools"
import {assoc, uniq, map} from "ramda"
import {createMapOf} from "hurdak"
import {now} from "paravel"
import {appDataKeys} from "src/util/nostr"
import {Publisher, mention} from "src/engine/network/utils"
import {getPubkeyHints} from "src/engine/relays/utils"
import {user, nip59} from "src/engine/session/derived"
import {setAppData} from "src/engine/session/commands"
import {channels} from "./state"

export const createMessage = (channelId: string, content: string) => {
  const recipients = channelId.split(",")
  const template = {
    content,
    kind: 14,
    created_at: now(),
    tags: recipients.map(mention),
  }

  for (const pubkey of uniq(recipients.concat(user.get().pubkey))) {
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

export const publishChannelsRead = () =>
  setAppData(appDataKeys.NIP24_LAST_CHECKED, createMapOf("id", "last_checked", channels.get()))

export const markAllChannelsRead = () => {
  // @ts-ignore
  channels.update(map(assoc("last_checked", now())))

  publishChannelsRead()
}

export const markChannelRead = (pubkey: string) => {
  channels.key(pubkey).update(assoc("last_checked", now()))

  publishChannelsRead()
}
