import {user, nip04, getInboxHints, getSetting} from "src/engine2/queries"
import type {PublishOpts} from "./util"
import {publishEvent} from "./util"

export const publishNip04Message = async (
  recipient,
  {relays, content = "", tags = []}: PublishOpts
) => {
  const pubkeys = [recipient, user.get().pubkey]

  return publishEvent(4, {
    relays: relays || getInboxHints(getSetting("relay_limit"), pubkeys),
    content: await nip04.get().encryptAsUser(content, recipient),
    tags: [...tags, ["p", recipient]],
  })
}
