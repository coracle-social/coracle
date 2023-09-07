import {find, sortBy, identity} from "ramda"
import type {Channel} from "src/engine2/model"
import {channels} from "src/engine2/state"

export const messageIsNew = ({last_checked, last_received, last_sent}: Channel) =>
  last_received > Math.max(last_sent || 0, last_checked || 0)

export const deriveHasNewMessages = channels.derived(
  find((c: Channel) => c.last_sent > 0 && messageIsNew(c))
)

export const getNip24ChannelId = (pubkeys: string[]) => sortBy(identity, pubkeys).join(",")
