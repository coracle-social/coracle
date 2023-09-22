import type {Event} from "src/engine/events/model"

export type ZapEvent = Event & {
  invoiceAmount: number
  request: Event
}
