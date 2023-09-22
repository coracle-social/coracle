import type {RelayPolicy} from 'src/engine/relays/model'

export type Profile = {
  name?: string
  nip05?: string
  lud16?: string
  about?: string
  banner?: string
  picture?: string
  website?: string
  display_name?: string
}

export type Handle = {
  profile: Record<string, any>
  pubkey: string
  address: string
}

export type Zapper = {
  lnurl: string
  callback: string
  minSendable: number
  maxSendable: number
  nostrPubkey: string
}

export type Person = {
  pubkey: string
  last_fetched?: number
  profile_updated_at?: number
  profile?: Profile
  petnames_updated_at?: number
  petnames?: string[][]
  mutes_updated_at?: number
  mutes?: string[][]
  relays_updated_at?: number
  relays?: RelayPolicy[]
  handle_updated_at?: number
  handle?: Handle
  zapper_updated_at?: number
  zapper?: Zapper
}
