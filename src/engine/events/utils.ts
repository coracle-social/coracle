import {sortBy} from "ramda"
import type {Event} from "./model"

export const sortEventsDesc = sortBy((e: Event) => -e.created_at)
