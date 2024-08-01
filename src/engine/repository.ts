import {Repository, Relay} from "@welshman/util"
import {createEventStore} from "@welshman/store"

export const repository = new Repository()

export const relay = new Relay(repository)

export const events = createEventStore(repository)
