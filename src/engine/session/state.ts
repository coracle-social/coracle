import {writable} from "@coracle.social/lib"
import type {Session} from "./model"

export const env = writable<Record<string, any>>({})
export const pubkey = writable<string | null>(null)
export const sessions = writable<Record<string, Session>>({})
