import {collection} from "src/engine/core/utils"
import type {Event, Delete} from "./model"

export const events = collection<Event>("id")
export const deletes = collection<Delete>("value")
