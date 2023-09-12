import {channels} from "src/engine2/state"
import {selectHints, getSetting} from "src/engine2/queries"
import {subscribe} from "./subscription"

export const listenForNip28Messages = channelId => {
  const channel = channels.key(channelId).get()
  const relays = selectHints(getSetting("relay_limit"), channel?.relays || [])

  return subscribe({
    relays,
    filters: [
      {kinds: [40], ids: [channelId]},
      {kinds: [41, 42], "#e": [channelId]},
    ],
  })
}
