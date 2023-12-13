import {none, any, filter} from "ramda"
import {derived} from "src/engine/core/utils"
import {pubkey} from "src/engine/session/state"
import {mutes} from "src/engine/people/derived"
import type {Channel} from "./model"
import {channelHasNewMessages} from "./utils"
import {channels} from "./state"

export const userChannels = derived(
  [channels.throttle(300), mutes, pubkey],
  ([$channels, $mutes, $pk]): Channel[] => {
    if (!$pk) {
      return []
    }

    return $channels.filter($channel => {
      if (!$channel.messages) {
        return false
      }

      return $channel.members?.includes($pk) && none(pk => $mutes.has(pk), $channel.members || [])
    })
  },
)

export const unreadChannels = channels.derived(filter(channelHasNewMessages))

export const hasNewMessages = unreadChannels.derived(any((c: Channel) => Boolean(c.last_sent)))
