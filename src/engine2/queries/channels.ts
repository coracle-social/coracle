import {sortBy, identity, find, filter, path, whereEq} from "ramda"
import {fuzzy} from "src/util/misc"
import type {Channel} from "src/engine2/model"
import {channels} from "src/engine2/state"

// Common

export const sortChannels = sortBy(
  (c: Channel) => -Math.max(c.last_sent || 0, c.last_received || 0)
)

export const hasNewMessages = (c: Channel) =>
  c.last_received > Math.max(c.last_sent || 0, c.last_checked || 0)

export const getChannelSearch = $channels =>
  fuzzy($channels, {keys: ["meta.name", "meta.about"], threshold: 0.3})

// Nip04

export const nip04Channels = channels.throttle(300).derived(filter(whereEq({type: "nip04"})))

export const hasNewNip04Messages = nip04Channels.derived(find(hasNewMessages))

// Nip24

export const nip24Channels = channels.throttle(300).derived(filter(whereEq({type: "nip24"})))

export const hasNewNip24Messages = nip24Channels.derived(find(hasNewMessages))

export const getNip24ChannelId = (pubkeys: string[]) => sortBy(identity, pubkeys).join(",")

export const getNip24ChannelPubkeys = (id: string) => id.split(",")

// Nip28

export const nip28ChannelsWithMeta = channels
  .throttle(300)
  .derived(filter((c: Channel) => c.meta && c.type === "nip28"))

export const nip28ChannelsForUser = nip28ChannelsWithMeta.derived(filter(path(["nip28", "joined"])))

export const searchNip28Channels = nip28ChannelsWithMeta.derived(getChannelSearch)

export const hasNewNip28Messages = nip28ChannelsForUser.derived(find(hasNewMessages))
