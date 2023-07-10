export * from "src/system/env"
import {System} from "src/system"

const system = new System("coracle/system")

export default system
export const user = system.user
export const sync = system.sync
export const social = system.social
export const directory = system.directory
export const nip05 = system.nip05
export const nip57 = system.nip57
export const routing = system.routing
export const cache = system.cache
export const chat = system.chat
export const alerts = system.alerts
export const content = system.content
export const network = system.network
export const builder = system.builder
export const outbox = system.outbox
export const meta = system.meta
