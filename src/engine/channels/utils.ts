import {sortBy, uniq, identity} from "ramda"
import type {Channel} from "./model"

export const sortChannels = sortBy(
  (c: Channel) => -Math.max(c.last_sent || 0, c.last_received || 0),
)

export const channelHasNewMessages = (c: Channel) =>
  c.last_received > Math.max(c.last_sent || 0, c.last_checked || 0)

export const getChannelId = (pubkeys: string[]) => sortBy(identity, uniq(pubkeys)).join(",")
