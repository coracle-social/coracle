import {find, filter, path, whereEq} from "ramda"
import {hasNewMessages, getChannelSearch} from "./utils"
import type {Channel} from "./model"
import {channels} from "./state"

// Nip04

export const nip04Channels = channels.throttle(300).derived(filter(whereEq({type: "nip04"})))

export const hasNewNip04Messages = nip04Channels.derived(find(hasNewMessages))

// Nip24

export const nip24Channels = channels.throttle(300).derived(filter(whereEq({type: "nip24"})))

export const hasNewNip24Messages = nip24Channels.derived(find(hasNewMessages))

// Nip28

export const nip28ChannelsWithMeta = channels
  .throttle(300)
  .derived(filter((c: Channel) => c.meta && c.type === "nip28"))

export const nip28ChannelsForUser = nip28ChannelsWithMeta.derived(filter(path(["nip28", "joined"])))

export const searchNip28Channels = nip28ChannelsWithMeta.derived(getChannelSearch)

export const hasNewNip28Messages = nip28ChannelsForUser.derived(find(hasNewMessages))
