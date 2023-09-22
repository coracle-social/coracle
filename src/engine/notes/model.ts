import type {Event} from "src/engine/events/model"

export type DisplayEvent = Event & {
  replies?: DisplayEvent[]
}
