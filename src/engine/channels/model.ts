import type {Event} from "src/engine/events/model"

export type Channel = {
  id: string
  relays: string[]
  members: string[]
  messages: Event[]
  last_sent?: number
  last_received?: number
  last_checked?: number
}
