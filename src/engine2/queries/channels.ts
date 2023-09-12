import {sortBy, identity, find, pipe, filter, path, whereEq} from "ramda"
import type {Channel} from "src/engine2/model"
import {channels} from "src/engine2/state"

export const hasNewMessages = ({last_checked, last_received, last_sent}: Channel) =>
  last_received > Math.max(last_sent || 0, last_checked || 0)

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
