import {verifiedSymbol} from 'nostr-tools'
import type {Nip46Handler} from "@welshman/signer"
import type {SignedEvent, TrustedEvent} from "@welshman/util"
import type {RelayProfile, Handle as HandleInfo} from "@welshman/domain"

export type Session = {
  method: string
  pubkey: string
  secret?: string
  handler?: Nip46Handler
}

export type Relay = RelayProfile & {
  fetched_at: number,
}

export type Handle = HandleInfo & {
  fetched_at: number,
}

declare module '@welshman/util' {
  interface CustomEvent extends TrustedEvent {
    fetched_at: number
  }
}
