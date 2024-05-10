import type {TrustedEvent} from "@welshman/util"

export type Handler = {
  address: string
  event: TrustedEvent
}

export type HandlerRec = {
  address: string
  event: TrustedEvent
}
