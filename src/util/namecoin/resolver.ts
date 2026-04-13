/**
 * Namecoin NIP-05 Resolution for Coracle
 *
 * Resolves Namecoin blockchain names (.bit domains, d/ and id/ namespaces)
 * to Nostr public keys, enabling decentralised NIP-05-style identity
 * verification without relying on HTTP servers.
 *
 * Ported from Amethyst's Kotlin implementation:
 *   https://github.com/vitorpamplona/amethyst
 *
 * Architecture:
 *   The browser connects directly to ElectrumX servers via WebSocket.
 *   No proxy or backend is required — works as a fully static web app.
 *
 *   Based on the approach from hzrd149/nostrudel#352.
 *
 * Copyright (c) 2025 – MIT License (same terms as Amethyst & Coracle)
 */
import type {
  NamecoinNostrResult,
  NameShowResult,
  NamecoinSettings,
  NamecoinResolveOutcome,
} from "./types"
import {nameShowWithFallback} from "./electrumx-ws"
import {DEFAULT_CACHE_TTL} from "./constants"

// Re-export types that consumers need
export type {NamecoinNostrResult, NameShowResult, NamecoinSettings, NamecoinResolveOutcome}
export type {ElectrumxWsServer, ParsedNamecoinIdentifier} from "./types"

// ── Constants ──────────────────────────────────────────────────────────

const HEX_PUBKEY_REGEX = /^[0-9a-fA-F]{64}$/

export const DEFAULT_NAMECOIN_SETTINGS: NamecoinSettings = {
  enabled: true,
  servers: [],
  cacheTtl: DEFAULT_CACHE_TTL,
}

// ── Identifier Parsing ─────────────────────────────────────────────────

enum Namespace {
  DOMAIN = "DOMAIN",
  IDENTITY = "IDENTITY",
}

interface ParsedIdentifier {
  namecoinName: string
  localPart: string
  namespace: Namespace
}

/**
 * Check whether an identifier should be routed to Namecoin
 * resolution rather than standard NIP-05.
 */
export function isNamecoinIdentifier(identifier: string): boolean {
  const normalized = identifier.trim().toLowerCase()
  return normalized.endsWith(".bit") || normalized.startsWith("d/") || normalized.startsWith("id/")
}

/**
 * Parse a user-supplied string into a structured lookup request.
 *
 * Accepted formats:
 *   "alice@example.bit"  → d/example, localPart=alice
 *   "_@example.bit"      → d/example, localPart=_
 *   "example.bit"        → d/example, localPart=_
 *   "d/example"          → d/example, localPart=_
 *   "id/alice"           → id/alice,  localPart=_
 */
export function parseNamecoinIdentifier(raw: string): ParsedIdentifier | null {
  const input = raw.trim()

  // Direct namespace references
  if (input.toLowerCase().startsWith("d/")) {
    return {
      namecoinName: input.toLowerCase(),
      localPart: "_",
      namespace: Namespace.DOMAIN,
    }
  }
  if (input.toLowerCase().startsWith("id/")) {
    return {
      namecoinName: input.toLowerCase(),
      localPart: "_",
      namespace: Namespace.IDENTITY,
    }
  }

  // NIP-05 style: user@domain.bit
  if (input.includes("@") && input.toLowerCase().endsWith(".bit")) {
    const parts = input.split("@", 2)
    if (parts.length !== 2) return null
    const localPart = parts[0].toLowerCase() || "_"
    const domain = parts[1].replace(/\.bit$/i, "").toLowerCase()
    if (!domain) return null
    return {
      namecoinName: `d/${domain}`,
      localPart,
      namespace: Namespace.DOMAIN,
    }
  }

  // Bare domain: example.bit
  if (input.toLowerCase().endsWith(".bit")) {
    const domain = input.replace(/\.bit$/i, "").toLowerCase()
    if (!domain) return null
    return {
      namecoinName: `d/${domain}`,
      localPart: "_",
      namespace: Namespace.DOMAIN,
    }
  }

  return null
}

// Keep old name as alias for backwards compatibility in tests
export {parseNamecoinIdentifier as parseIdentifier}

// ── Value Extraction ───────────────────────────────────────────────────

function isValidPubkey(s: string): boolean {
  return HEX_PUBKEY_REGEX.test(s)
}

function extractRelays(nostrObj: Record<string, any>, pubkey: string): string[] {
  try {
    const relaysMap = nostrObj.relays
    if (!relaysMap || typeof relaysMap !== "object") return []
    const relayArray = relaysMap[pubkey.toLowerCase()] || relaysMap[pubkey]
    if (!Array.isArray(relayArray)) return []
    return relayArray.filter((r: any) => typeof r === "string")
  } catch {
    return []
  }
}

/**
 * Extract Nostr data from a `d/` domain value.
 *
 * Supports:
 *   { "nostr": "hex-pubkey" }                           → simple form
 *   { "nostr": { "names": { "alice": "hex" }, ... } }   → extended NIP-05-like form
 */
function extractFromDomainValue(
  value: Record<string, any>,
  parsed: ParsedIdentifier,
): NamecoinNostrResult | null {
  const nostrField = value.nostr
  if (nostrField === undefined || nostrField === null) return null

  // Simple form: "nostr": "hex-pubkey"
  if (typeof nostrField === "string") {
    if (parsed.localPart === "_" && isValidPubkey(nostrField)) {
      return {
        pubkey: nostrField.toLowerCase(),
        relays: [],
        namecoinName: parsed.namecoinName,
        localPart: "_",
      }
    }
    if (parsed.localPart !== "_") return null
  }

  // Extended form: "nostr": { "names": {...}, "relays": {...} }
  if (typeof nostrField === "object" && !Array.isArray(nostrField)) {
    const names = nostrField.names
    if (!names || typeof names !== "object") return null

    let resolvedLocalPart: string
    let pubkey: string

    const exactMatch = names[parsed.localPart]
    const rootMatch = names["_"]
    const entries = Object.entries(names)
    const firstEntry = parsed.localPart === "_" && entries.length > 0 ? entries[0] : null

    if (typeof exactMatch === "string" && isValidPubkey(exactMatch)) {
      resolvedLocalPart = parsed.localPart
      pubkey = exactMatch
    } else if (typeof rootMatch === "string" && isValidPubkey(rootMatch)) {
      resolvedLocalPart = "_"
      pubkey = rootMatch
    } else if (firstEntry && typeof firstEntry[1] === "string" && isValidPubkey(firstEntry[1])) {
      resolvedLocalPart = firstEntry[0]
      pubkey = firstEntry[1] as string
    } else {
      return null
    }

    const relays = extractRelays(nostrField, pubkey)
    return {
      pubkey: pubkey.toLowerCase(),
      relays,
      namecoinName: parsed.namecoinName,
      localPart: resolvedLocalPart,
    }
  }

  return null
}

/**
 * Extract Nostr data from an `id/` identity value.
 */
function extractFromIdentityValue(
  value: Record<string, any>,
  parsed: ParsedIdentifier,
): NamecoinNostrResult | null {
  const nostrField = value.nostr
  if (nostrField === undefined || nostrField === null) return null

  // Simple: "nostr": "hex-pubkey"
  if (typeof nostrField === "string") {
    if (isValidPubkey(nostrField)) {
      return {
        pubkey: nostrField.toLowerCase(),
        relays: [],
        namecoinName: parsed.namecoinName,
        localPart: "_",
      }
    }
  }

  // Object form: "nostr": { "pubkey": "hex", "relays": [...] }
  if (typeof nostrField === "object" && !Array.isArray(nostrField)) {
    const pubkey = nostrField.pubkey
    if (typeof pubkey === "string" && isValidPubkey(pubkey)) {
      const relays = Array.isArray(nostrField.relays)
        ? nostrField.relays.filter((r: any) => typeof r === "string")
        : []
      return {
        pubkey: pubkey.toLowerCase(),
        relays,
        namecoinName: parsed.namecoinName,
        localPart: "_",
      }
    }

    // Also try NIP-05-like "names" structure for id/ names
    const names = nostrField.names
    if (names && typeof names === "object") {
      const rootPubkey = names["_"]
      if (typeof rootPubkey === "string" && isValidPubkey(rootPubkey)) {
        const relays = extractRelays(nostrField, rootPubkey)
        return {
          pubkey: rootPubkey.toLowerCase(),
          relays,
          namecoinName: parsed.namecoinName,
          localPart: "_",
        }
      }
    }
  }

  return null
}

// ── Main Resolver ──────────────────────────────────────────────────────

/**
 * Resolve a user-supplied identifier to a Nostr pubkey via Namecoin.
 *
 * @param identifier User input, e.g. "alice@example.bit", "id/alice", "example.bit"
 * @param servers Custom ElectrumX WebSocket server URLs
 * @param timeoutMs Maximum time to wait
 */
export async function resolveNamecoin(
  identifier: string,
  servers?: string[],
  timeoutMs = 20_000,
): Promise<NamecoinNostrResult | null> {
  const parsed = parseNamecoinIdentifier(identifier)
  if (!parsed) return null

  const result = await Promise.race([
    performLookup(parsed, servers),
    new Promise<null>(resolve => setTimeout(() => resolve(null), timeoutMs)),
  ])

  return result
}

/**
 * Resolve with detailed outcome for error reporting in UI flows.
 */
export async function resolveNamecoinDetailed(
  identifier: string,
  servers?: string[],
  timeoutMs = 20_000,
): Promise<NamecoinResolveOutcome> {
  const parsed = parseNamecoinIdentifier(identifier)
  if (!parsed) return {type: "invalid_identifier", identifier}

  try {
    const result = await Promise.race([
      performLookupDetailed(parsed, servers),
      new Promise<NamecoinResolveOutcome>(resolve =>
        setTimeout(() => resolve({type: "timeout"}), timeoutMs),
      ),
    ])
    return result
  } catch {
    return {type: "timeout"}
  }
}

async function performLookup(
  parsed: ParsedIdentifier,
  servers?: string[],
): Promise<NamecoinNostrResult | null> {
  try {
    const nameResult = await nameShowWithFallback(parsed.namecoinName, servers)
    if (!nameResult) return null

    let valueJson: Record<string, any>
    try {
      valueJson = JSON.parse(nameResult.value)
    } catch {
      return null
    }

    return parsed.namespace === Namespace.DOMAIN
      ? extractFromDomainValue(valueJson, parsed)
      : extractFromIdentityValue(valueJson, parsed)
  } catch {
    return null
  }
}

async function performLookupDetailed(
  parsed: ParsedIdentifier,
  servers?: string[],
): Promise<NamecoinResolveOutcome> {
  let nameResult: NameShowResult | null
  try {
    nameResult = await nameShowWithFallback(parsed.namecoinName, servers)
    if (!nameResult) return {type: "name_not_found", name: parsed.namecoinName}
  } catch (e: any) {
    return {type: "servers_unreachable", message: e?.message || "All servers unreachable"}
  }

  if (nameResult.expired) {
    return {type: "name_not_found", name: parsed.namecoinName}
  }

  let valueJson: Record<string, any>
  try {
    valueJson = JSON.parse(nameResult.value)
  } catch {
    return {type: "no_nostr_field", name: parsed.namecoinName}
  }

  const nostrResult =
    parsed.namespace === Namespace.DOMAIN
      ? extractFromDomainValue(valueJson, parsed)
      : extractFromIdentityValue(valueJson, parsed)

  return nostrResult
    ? {type: "success", result: nostrResult}
    : {type: "no_nostr_field", name: parsed.namecoinName}
}

// ── Cache ──────────────────────────────────────────────────────────────

interface CachedResult {
  result: NamecoinNostrResult | null
  timestamp: number
}

const cache = new Map<string, CachedResult>()
const CACHE_TTL_MS = 3_600_000 // 1 hour
const MAX_CACHE_SIZE = 500

function cacheKey(identifier: string): string {
  return identifier.trim().toLowerCase()
}

export function getCached(identifier: string): NamecoinNostrResult | null | undefined {
  const key = cacheKey(identifier)
  const entry = cache.get(key)
  if (!entry) return undefined
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    cache.delete(key)
    return undefined
  }
  return entry.result
}

export function setCache(identifier: string, result: NamecoinNostrResult | null): void {
  if (cache.size >= MAX_CACHE_SIZE) {
    const oldestKey = cache.keys().next().value
    if (oldestKey) cache.delete(oldestKey)
  }
  cache.set(cacheKey(identifier), {result, timestamp: Date.now()})
}

export function clearCache(): void {
  cache.clear()
}

// ── High-level API (with cache) ────────────────────────────────────────

/**
 * Resolve a Namecoin identifier to a Nostr pubkey (with caching).
 */
export async function resolveNamecoinCached(
  identifier: string,
  servers?: string[],
): Promise<NamecoinNostrResult | null> {
  const cached = getCached(identifier)
  if (cached !== undefined) return cached

  const result = await resolveNamecoin(identifier, servers)
  setCache(identifier, result)
  return result
}

/**
 * Verify that a Namecoin name maps to the expected pubkey.
 */
export async function verifyNamecoinNip05(
  nip05Address: string,
  expectedPubkeyHex: string,
  servers?: string[],
): Promise<boolean> {
  if (!isNamecoinIdentifier(nip05Address)) return false
  const result = await resolveNamecoinCached(nip05Address, servers)
  if (!result) return false
  return result.pubkey.toLowerCase() === expectedPubkeyHex.toLowerCase()
}

// ── Runtime settings ───────────────────────────────────────────────────

let _getSettings: (() => NamecoinSettings) | null = null

export function setNamecoinSettingsAccessor(fn: () => NamecoinSettings): void {
  _getSettings = fn
}

export function getRuntimeSettings(): NamecoinSettings {
  return _getSettings?.() ?? DEFAULT_NAMECOIN_SETTINGS
}

/**
 * Resolve using the current user settings (convenience wrapper).
 * This is what nostr.ts and other callers should use.
 */
export async function resolveNamecoinWithSettings(
  identifier: string,
): Promise<NamecoinNostrResult | null> {
  const settings = getRuntimeSettings()
  if (!settings.enabled) return null
  return resolveNamecoinCached(identifier, settings.servers)
}

/**
 * Verify using the current user settings (convenience wrapper).
 */
export async function verifyNamecoinWithSettings(
  nip05Address: string,
  expectedPubkeyHex: string,
): Promise<boolean> {
  if (!isNamecoinIdentifier(nip05Address)) return false
  const result = await resolveNamecoinWithSettings(nip05Address)
  if (!result) return false
  return result.pubkey.toLowerCase() === expectedPubkeyHex.toLowerCase()
}

// ── Settings Helpers ───────────────────────────────────────────────────

/**
 * Parse a server string (WebSocket URL or host:port) into an ElectrumxServer-like object.
 * Kept for backwards compatibility with tests.
 */
export function parseServerString(
  s: string,
): {host: string; port: number; wsUrl?: string; useSsl: boolean; trustAllCerts?: boolean} | null {
  const trimmed = s.trim()

  if (trimmed.startsWith("wss://") || trimmed.startsWith("ws://")) {
    try {
      const url = new URL(trimmed)
      return {
        host: url.hostname,
        port: parseInt(url.port) || (url.protocol === "wss:" ? 443 : 80),
        wsUrl: trimmed,
        useSsl: url.protocol === "wss:",
      }
    } catch {
      return null
    }
  }

  const parts = trimmed.split(":")
  if (parts.length < 2) return null
  const host = parts[0].trim()
  const port = parseInt(parts[1].trim())
  if (!host || isNaN(port) || port <= 0 || port > 65535) return null
  const useSsl = parts[2]?.trim().toLowerCase() !== "tcp"
  const isOnion = host.endsWith(".onion")
  return {
    host,
    port,
    useSsl,
    trustAllCerts: isOnion || !useSsl,
  }
}

export function formatServerString(server: {
  host: string
  port: number
  wsUrl?: string
  useSsl: boolean
}): string {
  if (server.wsUrl) return server.wsUrl
  const base = `${server.host}:${server.port}`
  return server.useSsl ? base : `${base}:tcp`
}
