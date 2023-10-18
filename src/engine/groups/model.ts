import type {Event} from "src/engine/events/model"

export type Group = {
  id: string
  pubkey: string
  address: string
  updated_at?: number
  access?: "open" | "closed" | "hybrid"
  relays?: string[]
  name?: string
  image?: string
  description?: string
  moderators?: string[]
}

export type GroupKey = {
  group: string
  pubkey: string
  privkey: string
  created_at: number
  members: string[]
  hints?: string[]
}

export type GroupRequest = Event & {
  group: string
  resolved: boolean
}
