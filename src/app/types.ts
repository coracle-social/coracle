import type {Nip46Handler} from "@welshman/signer"

export type Session = {
  method: string
  pubkey: string
  secret?: string
  handler?: Nip46Handler
}

export type RelayInfo = {
  fetched_at: number
}

export type HandleInfo = {
  pubkey: string
  nip05: string
  nip46: string[]
  relays: string[]
  fetched_at: number
}
