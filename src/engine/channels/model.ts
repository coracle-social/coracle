import type {TrustedEvent} from "@welshman/util"

export type Channel = {
  id: string
  relays: string[]
  members: string[]
  messages: TrustedEvent[]
  last_sent?: number
  last_received?: number
  last_checked?: number
}
