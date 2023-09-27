import {find, filter, whereEq} from "ramda"
import {hasNewMessages} from "./utils"
import {channels} from "./state"

// Nip04

export const nip04Channels = channels.throttle(300).derived(filter(whereEq({type: "nip04"})))

export const hasNewNip04Messages = nip04Channels.derived(find(hasNewMessages))

// Nip24

export const nip24Channels = channels.throttle(300).derived(filter(whereEq({type: "nip24"})))

export const hasNewNip24Messages = nip24Channels.derived(find(hasNewMessages))
