import {collection} from "src/engine/core/utils"
import type {Event} from "src/engine/events/model"

export const _labels = collection<Event>("id")
