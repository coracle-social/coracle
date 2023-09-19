import {Pool} from "paravel"
import {collection, writable} from "src/engine2/util/store"
import type {Event, Delete, Session, Channel, Topic, List, Person, Relay} from "src/engine2/model"

// Synchronous stores

export const pubkey = writable<string | null>(null)
export const sessions = writable<Record<string, Session>>({})
export const env = writable<Record<string, any>>({})
export const notificationsLastChecked = writable(0)
export const nip04ChannelsLastChecked = writable(0)
export const nip24ChannelsLastChecked = writable(0)
export const nip28ChannelsLastJoined = writable(0)

// Async stores

export const events = collection<Event>("id")
export const deletes = collection<Delete>("value")
export const labels = collection<Event>("id")
export const topics = collection<Topic>("name")
export const lists = collection<List>("naddr")
export const people = collection<Person>("pubkey")
export const relays = collection<Relay>("url")
export const channels = collection<Channel>("id")

// Other stuff

export const pool = new Pool()
