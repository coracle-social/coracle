import {generatePrivateKey} from "nostr-tools"
import {user, wrapper, getSetting, getPubkeyHints} from "src/engine2/queries"
import {Publisher} from "./publisher"
import {mention} from "./util"

export function createNip24Message({content, channelId}) {
  const recipients = channelId.split(",")
  const template = {kind: 14, content, tags: recipients.map(mention)}

  for (const pubkey of recipients.concat(user.get().pubkey)) {
    Publisher.publish({
      relays: getPubkeyHints(getSetting("relay_limit"), pubkey, "read"),
      event: wrapper.get().wrap(template, {
        wrap: {
          author: generatePrivateKey(),
          recipient: pubkey,
        },
      }),
    })
  }
}
