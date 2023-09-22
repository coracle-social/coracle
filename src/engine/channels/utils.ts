import {sortBy, uniq, identity} from "ramda"
import {fuzzy} from "src/util/misc"
import type {Channel} from "./model"

export const sortChannels = sortBy(
  (c: Channel) => -Math.max(c.last_sent || 0, c.last_received || 0)
)

export const hasNewMessages = (c: Channel) =>
  c.last_received > Math.max(c.last_sent || 0, c.last_checked || 0)

export const getChannelSearch = $channels =>
  fuzzy($channels, {keys: ["meta.name", "meta.about"], threshold: 0.3})

export const getNip24ChannelId = (pubkeys: string[]) => sortBy(identity, uniq(pubkeys)).join(",")

export const getNip24ChannelPubkeys = (id: string) => id.split(",")
