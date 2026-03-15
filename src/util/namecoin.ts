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
 *   Browsers cannot make raw TCP/TLS connections to ElectrumX servers.
 *   Instead, the browser makes simple HTTP requests to a lightweight
 *   proxy that bridges HTTP → ElectrumX JSON-RPC over TCP.
 *
 *   The proxy handles all ElectrumX protocol details (scripthash
 *   computation, transaction fetching, NAME_UPDATE script parsing).
 *   The browser only needs to parse the returned JSON value.
 *
 *   In development, Vite serves the proxy at /api/namecoin/*.
 *   In production, a hosted proxy URL is configured via VITE_NAMECOIN_PROXY_URL.
 *
 * Copyright (c) 2025 – MIT License (same terms as Amethyst & Coracle)
 */

// ── Types ──────────────────────────────────────────────────────────────

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

export interface NameShowResult {
  name: string
  value: string
  txid?: string
  height?: number
  expiresIn?: number
}

export interface ElectrumxServer {
  host: string
  port: number
  /** WebSocket URL override (e.g. "wss://electrumx.example.com:50004") */
  wsUrl?: string
  useSsl: boolean
  trustAllCerts?: boolean
}

export type NamecoinResolveOutcome =
  | {type: "success"; result: NamecoinNostrResult}
  | {type: "name_not_found"; name: string}
  | {type: "no_nostr_field"; name: string}
  | {type: "servers_unreachable"; message: string}
  | {type: "invalid_identifier"; identifier: string}
  | {type: "timeout"}

export interface NamecoinSettings {
  enabled: boolean
  /** Custom ElectrumX servers (used by the proxy, not by the browser directly) */
  customServers: string[]
  /** HTTP proxy URL for ElectrumX queries — required for browser resolution */
  proxyUrl: string
}

// ── Constants ──────────────────────────────────────────────────────────

const HEX_PUBKEY_REGEX = /^[0-9a-fA-F]{64}$/

/** Default ElectrumX servers (informational — used by proxy, not browser) */
export const DEFAULT_ELECTRUMX_SERVERS: ElectrumxServer[] = [
  {
    host: "nmc2.bitcoins.sk",
    port: 57001,
    useSsl: false,
    trustAllCerts: true,
  },
]

export const DEFAULT_NAMECOIN_SETTINGS: NamecoinSettings = {
  enabled: true,
  customServers: [],
  proxyUrl: "",
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
  return (
    normalized.endsWith(".bit") ||
    normalized.startsWith("d/") ||
    normalized.startsWith("id/")
  )
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
function parseIdentifier(raw: string): ParsedIdentifier | null {
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

// ── HTTP Proxy Client ──────────────────────────────────────────────────

/**
 * Resolve the proxy base URL.
 *
 * In order of priority:
 *   1. Explicit proxyUrl from user settings
 *   2. VITE_NAMECOIN_PROXY_URL env var (set at build time)
 *   3. Same-origin /api/namecoin (Vite dev middleware or reverse proxy)
 */
function resolveProxyUrl(proxyUrl?: string): string {
  if (proxyUrl) return proxyUrl.replace(/\/+$/, "")
  const envUrl = import.meta.env?.VITE_NAMECOIN_PROXY_URL
  if (envUrl) return envUrl.replace(/\/+$/, "")
  return "/api/namecoin"
}

/**
 * Perform a name_show lookup via the HTTP proxy.
 *
 * The proxy accepts:
 *   GET /name/d/example   → resolves d/example
 *   GET /name/id/alice    → resolves id/alice
 *
 * Returns: { name, value (JSON string), txid, height, expires_in }
 */
async function nameShowViaProxy(
  identifier: string,
  proxyUrl: string,
): Promise<NameShowResult | null> {
  const url = `${proxyUrl}/name/${encodeURIComponent(identifier)}`
  const response = await fetch(url, {
    headers: {Accept: "application/json"},
    signal: AbortSignal.timeout(15_000),
  })

  if (!response.ok) {
    if (response.status === 404) {
      throw {type: "name_not_found", name: identifier}
    }
    throw new Error(`Proxy error: ${response.status}`)
  }

  const data = await response.json()
  if (data.error) {
    throw {type: data.error, name: identifier}
  }
  return {
    name: data.name || identifier,
    value: typeof data.value === "string" ? data.value : JSON.stringify(data.value),
    txid: data.txid,
    height: data.height,
    expiresIn: data.expires_in ?? data.expiresIn,
  }
}

// ── Main Resolver ──────────────────────────────────────────────────────

/**
 * Resolve a user-supplied identifier to a Nostr pubkey via Namecoin.
 *
 * @param identifier User input, e.g. "alice@example.bit", "id/alice", "example.bit"
 * @param proxyUrl HTTP proxy URL (resolved automatically if not provided)
 * @param timeoutMs Maximum time to wait
 */
export async function resolveNamecoin(
  identifier: string,
  proxyUrl?: string,
  timeoutMs = 20_000,
): Promise<NamecoinNostrResult | null> {
  const parsed = parseIdentifier(identifier)
  if (!parsed) return null

  const result = await Promise.race([
    performLookup(parsed, proxyUrl),
    new Promise<null>(resolve => setTimeout(() => resolve(null), timeoutMs)),
  ])

  return result
}

/**
 * Resolve with detailed outcome for error reporting in UI flows.
 */
export async function resolveNamecoinDetailed(
  identifier: string,
  proxyUrl?: string,
  timeoutMs = 20_000,
): Promise<NamecoinResolveOutcome> {
  const parsed = parseIdentifier(identifier)
  if (!parsed) return {type: "invalid_identifier", identifier}

  try {
    const result = await Promise.race([
      performLookupDetailed(parsed, proxyUrl),
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
  proxyUrl?: string,
): Promise<NamecoinNostrResult | null> {
  try {
    const url = resolveProxyUrl(proxyUrl)
    const nameResult = await nameShowViaProxy(parsed.namecoinName, url)
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
  proxyUrl?: string,
): Promise<NamecoinResolveOutcome> {
  const url = resolveProxyUrl(proxyUrl)
  let nameResult: NameShowResult | null
  try {
    nameResult = await nameShowViaProxy(parsed.namecoinName, url)
    if (!nameResult) return {type: "name_not_found", name: parsed.namecoinName}
  } catch (e: any) {
    if (e?.type === "name_not_found" || e?.type === "name_expired") {
      return {type: "name_not_found", name: parsed.namecoinName}
    }
    if (e?.type === "servers_unreachable") {
      return {type: "servers_unreachable", message: e.message}
    }
    return {type: "servers_unreachable", message: e?.message || "Unknown error"}
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
  proxyUrl?: string,
): Promise<NamecoinNostrResult | null> {
  const cached = getCached(identifier)
  if (cached !== undefined) return cached

  const result = await resolveNamecoin(identifier, proxyUrl)
  setCache(identifier, result)
  return result
}

/**
 * Verify that a Namecoin name maps to the expected pubkey.
 */
export async function verifyNamecoinNip05(
  nip05Address: string,
  expectedPubkeyHex: string,
  proxyUrl?: string,
): Promise<boolean> {
  if (!isNamecoinIdentifier(nip05Address)) return false
  const result = await resolveNamecoinCached(nip05Address, proxyUrl)
  if (!result) return false
  return result.pubkey.toLowerCase() === expectedPubkeyHex.toLowerCase()
}

// ── Runtime settings accessor ──────────────────────────────────────────

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
  return resolveNamecoinCached(identifier, settings.proxyUrl || undefined)
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
 * Parse "host:port" or a WebSocket URL into an ElectrumxServer.
 */
export function parseServerString(s: string): ElectrumxServer | null {
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

export function formatServerString(server: ElectrumxServer): string {
  if (server.wsUrl) return server.wsUrl
  const base = `${server.host}:${server.port}`
  return server.useSsl ? base : `${base}:tcp`
}
