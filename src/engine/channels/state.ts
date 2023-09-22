import {writable, collection} from "src/engine/core/utils"
import type {Channel} from "./model"

export const channels = collection<Channel>("id")
export const nip04ChannelsLastChecked = writable(0)
export const nip24ChannelsLastChecked = writable(0)
export const nip28ChannelsLastJoined = writable(0)
