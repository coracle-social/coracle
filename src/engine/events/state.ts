import {Collection, Writable} from "@welshman/lib"
import type {TrustedEvent} from "@welshman/util"
import type {ReadReceipt, PublishInfo} from "./model"

export const _events = new Collection<TrustedEvent>("id", 1000)
export const seen = new Collection<ReadReceipt>("id", 1000)
export const deletes = new Writable(new Set<string>(), 10000)
export const publishes = new Collection<PublishInfo>("id", 1000)
