import type {Event} from "src/engine/events/model"

export type Handler = {
  address: string
  event: Event
}

export type HandlerRec = {
  address: string
  event: Event
}
