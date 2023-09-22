import type {Event} from "src/engine/events/model"

export type Channel = {
  id: string
  type: "nip28" | "nip04" | "nip44"
  relays: string[]
  messages: Event[]
  last_sent?: number
  last_received?: number
  last_checked?: number
  meta_updated_at?: number
  meta?: {
    name?: string
    about?: string
    picture?: string
  }
  nip28?: {
    owner?: string
    joined?: string
  }
}
