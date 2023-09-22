import {collection} from "src/engine/core/utils"
import type {Event} from "src/engine/events/model"

export const labels = collection<Event>("id")
