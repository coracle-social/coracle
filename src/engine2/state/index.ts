import {Pool} from "paravel"
import {collection, writable} from "src/engine2/util/store"
import type {Event, Session, Channel, Topic, List, Person, Relay} from "src/engine2/model"

// Synchronous stores

export const sessions = writable<Record<string, Session>>({})
export const session = writable<Session | null>(null)
export const settings = writable<Record<string, any>>({})
export const env = writable<Record<string, any>>({})
export const alertsLastChecked = writable(0)

// Async stores

export const alerts = collection<Event & {recipient: string}>("id")
export const events = collection<Event>("id")
export const deletes = collection<{value: string}>("value")
export const labels = collection<Event>("id")
export const topics = collection<Topic>("name")
export const lists = collection<List>("naddr")
export const people = collection<Person>("pubkey")
export const relays = collection<Relay>("url")
export const channels = collection<Channel>("id")

// Other stuff

export const pool = new Pool()
