import type {Event} from "src/engine/events/model"

export type Channel = {
  id: string
  type: "nip04" | "nip44"
  relays: string[]
  messages: Event[]
  last_sent?: number
  last_received?: number
  last_checked?: number
  nip04?: {
    plaintext: string
  }
}
