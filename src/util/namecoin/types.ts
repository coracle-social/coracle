/**
 * Shared type definitions for Namecoin NIP-05 resolution.
 */

/** Result of resolving a Namecoin name to a Nostr pubkey */
export interface NamecoinNostrResult {
  /** Hex-encoded 32-byte Schnorr public key */
  pubkey: string
  /** Optional relay URLs where this user can be found */
  relays: string[]
  /** The Namecoin name that was resolved (e.g. "d/example") */
  namecoinName: string
  /** The local-part that was matched (e.g. "alice" or "_") */
  localPart: string
}

/** Raw result from ElectrumX name_show */
export interface NameShowResult {
  name: string
  value: string
  txid?: string
  height?: number
  expired?: boolean
  expiresIn?: number
}

/** An ElectrumX server accessible via WebSocket */
export interface ElectrumxWsServer {
  url: string
  label: string
}

/** Parsed Namecoin identifier */
export interface ParsedNamecoinIdentifier {
  namecoinName: string
  namespace: "DOMAIN" | "IDENTITY"
  name: string
  localPart?: string
  originalAddress?: string
}

/** User-configurable Namecoin settings */
export interface NamecoinSettings {
  enabled: boolean
  /** Custom ElectrumX WebSocket server URLs */
  servers?: string[]
  /** Cache TTL in milliseconds */
  cacheTtl?: number
}

/** Detailed outcome from a resolve attempt */
export type NamecoinResolveOutcome =
  | {type: "success"; result: NamecoinNostrResult}
  | {type: "name_not_found"; name: string}
  | {type: "no_nostr_field"; name: string}
  | {type: "servers_unreachable"; message: string}
  | {type: "invalid_identifier"; identifier: string}
  | {type: "timeout"}
