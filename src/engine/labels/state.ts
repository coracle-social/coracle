import {collection} from "@welshman/lib"
import type {Event} from "src/engine/events/model"

export const _labels = collection<Event>("id")
