import {collection} from "@coracle.social/lib"
import type {Event} from "src/engine/events/model"

export const _labels = collection<Event>("id")
