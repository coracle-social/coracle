import {sortBy} from "@welshman/lib"
import type {TrustedEvent} from "@welshman/util"

export const sortEventsDesc = events => sortBy((e: TrustedEvent) => -e.created_at, events)
