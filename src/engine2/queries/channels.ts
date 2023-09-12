import {sortBy, identity, find, pipe, filter, path, whereEq} from "ramda"
import {fuzzy} from "src/util/misc"
import type {Channel} from "src/engine2/model"
import {channels} from "src/engine2/state"

export const sortChannels = sortBy(
  (c: Channel) => -Math.max(c.last_sent || 0, c.last_received || 0)
)

export const hasNewMessages = (c: Channel) =>
  c.last_received > Math.max(c.last_sent || 0, c.last_checked || 0)

export const getNip24ChannelId = (pubkeys: string[]) => sortBy(identity, pubkeys).join(",")

export const hasNewNip28Messages = channels.derived(
  pipe(filter(path(["nip28", "joined"])), find(hasNewMessages))
)

export const hasNewNip04Messages = channels.derived(
  pipe(filter(whereEq({type: "nip04"})), find(hasNewMessages))
)

export const hasNewNip24Messages = channels.derived(
  pipe(filter(whereEq({type: "nip24"})), find(hasNewMessages))
)

export const nip28ChannelsWithMeta = channels.derived(
  filter((c: Channel) => c.meta && c.type === "nip28")
)

export const getChannelSearch = $channels =>
  fuzzy($channels, {keys: ["meta.name", "meta.about"], threshold: 0.3})

export const searchNip28Channels = nip28ChannelsWithMeta.derived(getChannelSearch)
