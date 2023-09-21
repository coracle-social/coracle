import {channels} from "src/engine/state"
import {selectHints} from "src/engine/queries"
import {subscribe} from "./subscription"

export const listenForNip28Messages = channelId => {
  const channel = channels.key(channelId).get()
  const relays = selectHints(channel?.relays || [])

  return subscribe({
    relays,
    filters: [
      {kinds: [40], ids: [channelId]},
      {kinds: [41, 42], "#e": [channelId]},
    ],
  })
}
