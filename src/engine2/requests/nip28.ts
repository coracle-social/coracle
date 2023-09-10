import {channels} from "src/engine2/state"
import {selectHints, getSetting} from "src/engine2/queries"
import {Subscription} from "./subscription"

export const loadNip28Messages = channelId => {
  const channel = channels.key(channelId).get()
  const relays = selectHints(getSetting("relay_limit"), channel?.relays || [])

  return new Subscription({
    relays,
    filters: [
      {kinds: [40], ids: [channelId]},
      {kinds: [41, 42], "#e": [channelId]},
    ],
  })
}
