import type {Event} from "src/engine/events/model"

export type Message = Event & {
  nip04?: {
    plaintext: string
  }
}

export type Channel = {
  id: string
  type: "nip04" | "nip44"
  relays: string[]
  members: string[]
  messages: Event[]
  last_sent?: number
  last_received?: number
  last_checked?: number
}
