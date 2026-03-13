/**
 * ZEN Balance Service
 *
 * Provides functionality to check ẐEN wallet balances for Nostr profiles.
 * Based on the UPlanet implementation for Ğ1/ZEN integration.
 *
 * ZEN is derived from Ğ1 currency: (Ğ1_BALANCE - 1) * 10 = ZEN
 *
 * Token Types (from UPLANET.official.sh):
 * - MULTIPASS (Usage Tokens): Service credits for relay usage, likes, etc.
 *   Flow: UPLANETNAME_G1 → UPLANETNAME → MULTIPASS
 *   Used for: likes (1 ẐEN each), relay operations, AI services
 *
 * - ZEN Card (Property Tokens): Cooperative ownership shares
 *   Flow: UPLANETNAME_G1 → UPLANETNAME_SOCIETY → ZEN Card → 3x1/3 (TREASURY/RnD/ASSETS)
 *   Must be renewed via G1society.sh
 *   Types: satellite (50€/year), constellation (540€/3 years), infrastructure
 *
 * Note: Liking a post costs 1 ẐEN (transferred via the relay's write policy)
 * See: NIP-101/relay.writePolicy.plugin/filter/7.sh
 *
 * Geolocated messages can be featured in UMAP (NOSTR.UMAP.refresh.sh)
 * if the user has ipns_vault configured for their uDRIVE.
 */

import {writable, type Readable} from "svelte/store"

// Token type constants
export const TOKEN_TYPE_USAGE = "usage" as const // MULTIPASS tokens
export const TOKEN_TYPE_PROPERTY = "property" as const // ZEN Card tokens

// Types
export interface ZenBalance {
  g1Balance: number
  zenBalance: number
  g1pub: string
  loading?: boolean
  error?: string
  tokenType?: typeof TOKEN_TYPE_USAGE | typeof TOKEN_TYPE_PROPERTY
}

export interface ProfileIdentities {
  g1pub?: string // MULTIPASS G1 public key (usage tokens)
  zencard?: string // ZEN Card wallet address (property tokens)
  website?: string
  mastodon?: string
  email?: string // Required for notifications
  ipfs_gw?: string // IPFS Gateway URL
  ipns_vault?: string // NOSTR Card IPNS vault key (enables uDRIVE & geo-messages)
  tw_feed?: string // TW Feed IPNS key
  github?: string
  twitter?: string
  telegram?: string
}

/**
 * Status of ẐEN receivability for a profile
 * Based on fields from nostr_setup_profile.py
 */
export interface ZenReceivability {
  canReceive: boolean // Has at least MULTIPASS or ZEN Card
  hasMultipass: boolean // g1pub field present (can receive from likes)
  hasZenCard: boolean // zencard field present (has cooperative shares)
  hasEmail: boolean // email field (for payment notifications)
  hasIpnsVault: boolean // ipns_vault field (for uDRIVE geo-content)
  isFeaturedInUMAP: boolean // Messages can appear in UMAP geo-aggregation
  missingFields: string[] // List of missing recommended fields
  renewalRecommended?: boolean // Property tokens may need renewal
}

// Configuration
const LIKE_COST_ZEN = 1

// API URL calculation (from current page URL)
export function getApiServerUrl(): string {
  if (typeof window === "undefined") return ""

  const url = new URL(window.location.href)

  // Replace ipfs. with u. in hostname
  const hostname = url.hostname.replace(/^ipfs\./, "u.")

  // Replace port 8080 with 54321 if present
  let port = url.port
  if (port === "8080") {
    port = "54321"
  }

  // Build the API URL
  const protocol = url.protocol
  return port ? `${protocol}//${hostname}:${port}` : `${protocol}//${hostname}`
}

// Relay URL calculation (for balance verification)
export function getRelayUrl(): string {
  if (typeof window === "undefined") return "wss://relay.copylaradio.com"

  const url = new URL(window.location.href)
  const relayName = url.hostname.replace("ipfs.", "relay.")

  if (url.port === "8080" || url.port !== "") {
    return "ws://127.0.0.1:7777" // Default local relay
  }

  return `wss://${relayName}`
}

/**
 * Check ZEN balance for a Ğ1 public key
 * @param g1pub - The Ğ1 public key to check
 * @returns Promise<ZenBalance | null>
 */
export async function checkZenBalance(g1pub: string): Promise<ZenBalance | null> {
  try {
    const apiUrl = getApiServerUrl()
    const response = await fetch(`${apiUrl}/check_balance?g1pub=${g1pub}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()

    if (data.balance && data.g1pub) {
      // Convert Ğ1 to ZEN: (Ğ1_BALANCE - 1) * 10
      const g1Balance = parseFloat(data.balance)
      const zenBalance = Math.floor((g1Balance - 1) * 10)

      return {
        g1Balance,
        zenBalance: Math.max(0, zenBalance), // Ensure non-negative
        g1pub: data.g1pub,
      }
    }

    return null
  } catch (error) {
    console.error("Error checking ZEN balance for", g1pub, ":", error)
    return null
  }
}

/**
 * Extract Ğ1/ZEN identities from Nostr profile event tags
 * Based on fields from nostr_setup_profile.py
 * @param tags - Event tags from kind:0 profile event
 * @returns ProfileIdentities
 */
export function extractIdentitiesFromTags(tags: string[][]): ProfileIdentities {
  const identities: ProfileIdentities = {}

  if (!tags || !Array.isArray(tags)) return identities

  for (const tag of tags) {
    if (tag.length >= 2 && tag[0] === "i") {
      const value = tag[1]

      // Core identity fields for ẐEN integration
      if (value.startsWith("g1pub:")) {
        identities.g1pub = value.substring(6)
      } else if (value.startsWith("zencard:")) {
        identities.zencard = value.substring(8)
      } else if (value.startsWith("email:")) {
        identities.email = value.substring(6)
      }
      // uDRIVE and IPFS fields (enables geo-featured content in UMAP)
      else if (value.startsWith("ipfs_gw:")) {
        identities.ipfs_gw = value.substring(8)
      } else if (value.startsWith("ipns_vault:")) {
        identities.ipns_vault = value.substring(11)
      } else if (value.startsWith("tw_feed:")) {
        identities.tw_feed = value.substring(8)
      }
      // Social identity fields
      else if (value.startsWith("website:")) {
        identities.website = value.substring(8)
      } else if (value.startsWith("mastodon:")) {
        identities.mastodon = value.substring(9)
      } else if (value.startsWith("github:")) {
        identities.github = value.substring(7)
      } else if (value.startsWith("twitter:")) {
        identities.twitter = value.substring(8)
      } else if (value.startsWith("telegram:")) {
        identities.telegram = value.substring(9)
      }
    }
  }

  return identities
}

/**
 * Check if a profile can receive ẐEN payments
 * Analyzes profile fields from nostr_setup_profile.py
 * @param identities - Profile identities extracted from profile
 * @returns ZenReceivability status
 */
export function checkZenReceivability(identities: ProfileIdentities): ZenReceivability {
  const missingFields: string[] = []

  // Check for MULTIPASS (usage tokens - from likes, relay usage)
  const hasMultipass = !!identities.g1pub && identities.g1pub.length > 0

  // Check for ZEN Card (property tokens - cooperative shares)
  const hasZenCard =
    !!identities.zencard && identities.zencard !== "None" && identities.zencard.trim() !== ""

  // Check for email (needed for payment notifications)
  const hasEmail = !!identities.email && identities.email.length > 0

  // Check for IPNS vault (enables uDRIVE and geo-content in UMAP)
  // From NOSTR.UMAP.refresh.sh: messages from users with ipns_vault can be featured
  const hasIpnsVault = !!identities.ipns_vault && identities.ipns_vault.length > 0

  // User can receive ẐEN if they have at least MULTIPASS or ZEN Card
  const canReceive = hasMultipass || hasZenCard

  // Messages can be featured in UMAP if user has ipns_vault for geo-content
  const isFeaturedInUMAP = hasIpnsVault

  // Build list of missing recommended fields
  if (!hasMultipass) missingFields.push("MULTIPASS (g1pub)")
  if (!hasZenCard) missingFields.push("ZEN Card (zencard)")
  if (!hasEmail) missingFields.push("Email")
  if (!hasIpnsVault) missingFields.push("uDRIVE (ipns_vault)")

  return {
    canReceive,
    hasMultipass,
    hasZenCard,
    hasEmail,
    hasIpnsVault,
    isFeaturedInUMAP,
    missingFields,
    renewalRecommended: false, // TODO: Check from DID metadata lastPayment
  }
}

/**
 * Check balances for all available addresses in profile identities
 * Returns both MULTIPASS (usage tokens) and ZEN Card (property tokens) balances
 * @param identities - Profile identities containing g1pub and/or zencard
 * @returns Promise with balance results for each found address
 */
export async function checkAllZenBalances(identities: ProfileIdentities): Promise<{
  multipass?: ZenBalance
  g1pub?: ZenBalance
  zencard?: ZenBalance
  usageTokens: number // Total MULTIPASS tokens (for likes, services)
  propertyTokens: number // Total ZEN Card tokens (cooperative shares)
}> {
  const balanceResults: {
    multipass?: ZenBalance
    g1pub?: ZenBalance
    zencard?: ZenBalance
    usageTokens: number
    propertyTokens: number
  } = {
    usageTokens: 0,
    propertyTokens: 0,
  }

  // Check Ğ1 balance (handles both MULTIPASS:PRIMAL format and simple g1pub)
  // MULTIPASS = Usage tokens (for likes, relay operations, AI services)
  if (identities.g1pub) {
    const g1pubParts = identities.g1pub.split(":")

    if (g1pubParts.length >= 2) {
      // MULTIPASS:PRIMAL format - check MULTIPASS part only
      const multipassPub = g1pubParts[0]
      const multipassBalance = await checkZenBalance(multipassPub)
      if (multipassBalance) {
        balanceResults.multipass = {
          ...multipassBalance,
          tokenType: TOKEN_TYPE_USAGE,
        }
        balanceResults.usageTokens = multipassBalance.zenBalance
      }
    } else {
      // Simple g1pub format - check the entire address
      const g1Balance = await checkZenBalance(identities.g1pub)
      if (g1Balance) {
        balanceResults.g1pub = {
          ...g1Balance,
          tokenType: TOKEN_TYPE_USAGE,
        }
        balanceResults.usageTokens = g1Balance.zenBalance
      }
    }
  }

  // Check ZenCard balance if available
  // ZEN Card = Property tokens (cooperative shares, must be renewed via G1society.sh)
  if (identities.zencard && identities.zencard !== "None" && identities.zencard.trim() !== "") {
    const zencardBalance = await checkZenBalance(identities.zencard)
    if (zencardBalance) {
      balanceResults.zencard = {
        ...zencardBalance,
        tokenType: TOKEN_TYPE_PROPERTY,
      }
      balanceResults.propertyTokens = zencardBalance.zenBalance
    }
  }

  return balanceResults
}

// Simple balance cache using Map
const balanceCache = new Map<string, {promise: Promise<ZenBalance | null>; timestamp: number}>()
const CACHE_TTL = 60000 // 1 minute cache

/**
 * Get cached ZEN balance for a Ğ1 public key
 */
export function getCachedZenBalance(g1pub: string): Promise<ZenBalance | null> {
  const now = Date.now()
  const cached = balanceCache.get(g1pub)

  // Return cached value if still valid
  if (cached && now - cached.timestamp < CACHE_TTL) {
    return cached.promise
  }

  // Fetch new value
  const promise = checkZenBalance(g1pub)
  balanceCache.set(g1pub, {promise, timestamp: now})

  // Cleanup old entries if cache grows too large
  if (balanceCache.size > 100) {
    const oldestKey = balanceCache.keys().next().value
    if (oldestKey) balanceCache.delete(oldestKey)
  }

  return promise
}

// Svelte store for reactive balance updates
export function createZenBalanceStore(g1pub: string): Readable<ZenBalance> {
  const {subscribe, set} = writable<ZenBalance>({
    g1Balance: 0,
    zenBalance: 0,
    g1pub,
    loading: true,
  })

  // Fetch balance on store creation
  getCachedZenBalance(g1pub).then(balance => {
    if (balance) {
      set({...balance, loading: false})
    } else {
      set({g1Balance: 0, zenBalance: 0, g1pub, loading: false, error: "Unable to fetch balance"})
    }
  })

  return {subscribe}
}

// Constants for display
export const LIKE_COST = LIKE_COST_ZEN
export const ZEN_SYMBOL = "Ẑ"
export const ZEN_CURRENCY_NAME = "ZEN"

/**
 * Format ZEN amount for display
 */
export function formatZen(amount: number): string {
  return `${amount} ${ZEN_SYMBOL}EN`
}

/**
 * Check if user's geolocated messages can be featured in UMAP
 * Based on NOSTR.UMAP.refresh.sh requirements
 * @param identities - Profile identities
 */
export function canBeFeaturedInUMAP(identities: ProfileIdentities): boolean {
  // User needs ipns_vault (uDRIVE) for their content to be featured in UMAP geo-aggregation
  return !!identities.ipns_vault && identities.ipns_vault.length > 0
}
