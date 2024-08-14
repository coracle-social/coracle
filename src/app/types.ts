import {verifiedSymbol} from 'nostr-tools'
import type {Nip46Handler} from "@welshman/signer"
import type {SignedEvent, TrustedEvent, RelayProfile} from "@welshman/util"

export type Session = {
  method: string
  pubkey: string
  secret?: string
  handler?: Nip46Handler
}

export type Relay = RelayProfile & {
  fetched_at: number,
}

export type Handle = {
  pubkey: string
  nip05: string
  nip46: string[]
  relays: string[]
  fetched_at: number,
}

declare module '@welshman/util' {
  interface CustomEvent extends TrustedEvent {
    fetched_at: number
  }
}
