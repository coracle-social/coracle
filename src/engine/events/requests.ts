import {prop} from "ramda"
import {seconds} from 'hurdak'
import {sessions} from "src/engine/session/state"
import {getUserHints} from "src/engine/relays/utils"
import {load} from "src/engine/network/utils"
import {deletesLastUpdated, seenLastUpdated, giftWrapLastFetched} from "./state"

export const loadDeletes = () => {
  const since = Math.max(0, deletesLastUpdated.get() - seconds(6, 'hour'))
  const authors = Object.values(sessions.get()).map(prop("pubkey"))

  return load({
    relays: getUserHints("write"),
    filters: [{kinds: [5], authors, since}],
  })
}

export const loadSeen = () => {
  const since = Math.max(0, seenLastUpdated.get() - seconds(6, 'hour'))
  const authors = Object.values(sessions.get()).map(prop("pubkey"))

  return load({
    relays: getUserHints("write"),
    filters: [{kinds: [15], authors, since}],
  })
}

export const loadGiftWrap = () => {
  const since = Math.max(0, giftWrapLastFetched.get() - seconds(6, 'hour'))
  const authors = Object.values(sessions.get()).filter(prop('privkey')).map(prop("pubkey"))

  return load({
    relays: getUserHints(),
    filters: [{kinds: [1059], authors, since}],
  })
}
