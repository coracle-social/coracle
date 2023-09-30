import {none, find, filter, whereEq} from "ramda"
import {derived} from "src/engine/core/utils"
import {pubkey} from "src/engine/session/state"
import {mutes} from "src/engine/people/derived"
import type {Channel} from "./model"
import {hasNewMessages} from "./utils"
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
  }
)

// Nip04

export const nip04Channels = userChannels.derived(filter(whereEq({type: "nip04"})))

export const hasNewNip04Messages = nip04Channels.derived(find(hasNewMessages))

// Nip24

export const nip24Channels = userChannels.derived(filter(whereEq({type: "nip24"})))

export const hasNewNip24Messages = nip24Channels.derived(find(hasNewMessages))
