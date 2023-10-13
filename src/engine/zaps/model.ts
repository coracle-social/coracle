import type {Event} from "src/engine/events/model"

export type Zapper = {
  lnurl: string
  callback: string
  minSendable: number
  maxSendable: number
  nostrPubkey: string
  allowsNostr: boolean
}

export type ZapEvent = Event & {
  invoiceAmount: number
  request: Event
}
