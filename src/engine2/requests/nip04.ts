import {user, getInboxHints, getSetting} from "src/engine2/queries"
import {Subscription} from "./subscription"

export function loadNip04Messages(contactPubkey: string) {
  const {pubkey: userPubkey} = user.get()

  return new Subscription({
    relays: getInboxHints(getSetting("relay_limit"), [contactPubkey, userPubkey]),
    filters: [
      {kinds: [4], authors: [userPubkey], "#p": [contactPubkey]},
      {kinds: [4], authors: [contactPubkey], "#p": [userPubkey]},
    ],
  })
}
