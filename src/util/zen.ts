import {writable} from "svelte/store"

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
 *
 * Duniter v2s (Substrate) support:
 * - g1v2 field = SS58 address on Duniter v2s blockchain
 * - Published via nostr_setup_profile.py --g1v2 flag
 * - Stored in kind:0 metadata content AND as ["i", "g1v2:<address>", ""] tag
 */

// Types
export interface ZenBalance {
  g1Balance: number
  zenBalance: number
  g1pub: string
  loading?: boolean
  error?: string
  tokenType?: "usage" | "property"
}

export interface ProfileIdentities {
  g1pub?: string // MULTIPASS G1 public key (usage tokens)
  g1v2?: string // Duniter v2s SS58 address (substrate blockchain)
  zencard?: string // ZEN Card wallet address (property tokens, G1 v1)
  zencard_v2?: string // ZEN Card SS58 address (Duniter v2s, 1-year history)
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
  hasG1v2: boolean // g1v2 field present (Duniter v2s SS58 address)
  hasEmail: boolean // email field (for payment notifications)
  hasIpnsVault: boolean // ipns_vault field (for uDRIVE geo-content)
  isFeaturedInUMAP: boolean // Messages can appear in UMAP geo-aggregation
  missingFields: string[] // List of missing recommended fields
}

// Fetch timeout (10 seconds)
const FETCH_TIMEOUT_MS = 10000

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

/**
 * Check ZEN balance for a Ğ1 public key or Duniter v2s SS58 address
 * UPassport /check_balance accepts both formats (auto-converts v1→SS58 via G1check.sh)
 * @param address - The Ğ1 public key or SS58 address to check
 * @returns Promise<ZenBalance | null>
 */
export async function checkZenBalance(address: string): Promise<ZenBalance | null> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const apiUrl = getApiServerUrl()
    const response = await fetch(`${apiUrl}/check_balance?g1pub=${encodeURIComponent(address)}`, {
      method: "GET",
      headers: {Accept: "application/json"},
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()

    if (data.balance && data.g1pub) {
      const g1Balance = parseFloat(data.balance)
      const zenBalance = Math.floor((g1Balance - 1) * 10)

      return {
        g1Balance,
        zenBalance: Math.max(0, zenBalance),
        g1pub: data.g1pub,
      }
    }

    return null
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      console.error("Timeout checking ZEN balance for", address)
    } else {
      console.error("Error checking ZEN balance for", address, ":", error)
    }
    return null
  } finally {
    clearTimeout(timeoutId)
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
      } else if (value.startsWith("g1v2:")) {
        identities.g1v2 = value.substring(5)
      } else if (value.startsWith("zencard_v2:")) {
        identities.zencard_v2 = value.substring(11)
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
    !!identities.zencard && !/^none$/i.test(identities.zencard) && identities.zencard.trim() !== ""

  // Check for Duniter v2s SS58 address
  const hasG1v2 = !!identities.g1v2 && identities.g1v2.length > 0

  // Check for email (needed for payment notifications)
  const hasEmail = !!identities.email && identities.email.length > 0

  // Check for IPNS vault (enables uDRIVE and geo-content in UMAP)
  const hasIpnsVault = !!identities.ipns_vault && identities.ipns_vault.length > 0

  // User can receive ẐEN if they have at least MULTIPASS or ZEN Card
  const canReceive = hasMultipass || hasZenCard

  // Messages can be featured in UMAP if user has ipns_vault for geo-content
  const isFeaturedInUMAP = hasIpnsVault

  // Build list of missing recommended fields
  if (!hasMultipass) missingFields.push("MULTIPASS (g1pub)")
  if (!hasZenCard) missingFields.push("ZEN Card (zencard)")
  if (!hasG1v2) missingFields.push("Duniter v2s (g1v2)")
  if (!hasEmail) missingFields.push("Email")
  if (!hasIpnsVault) missingFields.push("uDRIVE (ipns_vault)")

  return {
    canReceive,
    hasMultipass,
    hasZenCard,
    hasG1v2,
    hasEmail,
    hasIpnsVault,
    isFeaturedInUMAP,
    missingFields,
  }
}

/**
 * Check balances for all available addresses in profile identities
 * Returns both MULTIPASS (usage tokens) and ZEN Card (property tokens) balances
 * @param identities - Profile identities containing g1pub and/or zencard
 * @returns Promise with balance results for each found address
 */
export interface AllZenBalances {
  multipass?: ZenBalance
  g1pub?: ZenBalance
  g1v2?: ZenBalance // Duniter v2s SS58 balance
  zencard?: ZenBalance
  usageTokens: number // Total MULTIPASS tokens (for likes, services)
  propertyTokens: number // Total ZEN Card tokens (cooperative shares)
}

export async function checkAllZenBalances(identities: ProfileIdentities): Promise<AllZenBalances> {
  const balanceResults: AllZenBalances = {
    usageTokens: 0,
    propertyTokens: 0,
  }

  // Build parallel fetch promises
  const promises: Promise<void>[] = []

  // MULTIPASS usage tokens — prefer g1v2 (SS58) over g1pub (v1)
  const usageAddress = identities.g1v2?.trim() || null
  if (usageAddress) {
    // Use Duniter v2s SS58 address (preferred)
    promises.push(
      checkZenBalance(usageAddress).then(balance => {
        if (balance) {
          balanceResults.g1v2 = {...balance, tokenType: "usage"}
          balanceResults.usageTokens = balance.zenBalance
        }
      }),
    )
  } else if (identities.g1pub) {
    // Fallback to G1 v1 address
    const g1pubParts = identities.g1pub.split(":")
    const addressToCheck = g1pubParts.length >= 2 ? g1pubParts[0] : identities.g1pub
    const key = g1pubParts.length >= 2 ? "multipass" : "g1pub"

    if (addressToCheck && /^[a-zA-Z0-9+/=]+$/.test(addressToCheck)) {
      promises.push(
        checkZenBalance(addressToCheck).then(balance => {
          if (balance) {
            balanceResults[key] = {...balance, tokenType: "usage"}
            balanceResults.usageTokens = balance.zenBalance
          }
        }),
      )
    }
  }

  // ZEN Card property tokens — prefer zencard_v2 (SS58) over zencard (v1)
  const zencardAddress =
    identities.zencard_v2?.trim() ||
    (identities.zencard?.trim() && !/^none$/i.test(identities.zencard) ? identities.zencard : null)
  if (zencardAddress) {
    promises.push(
      checkZenBalance(zencardAddress).then(balance => {
        if (balance) {
          balanceResults.zencard = {...balance, tokenType: "property"}
          balanceResults.propertyTokens = balance.zenBalance
        }
      }),
    )
  }

  await Promise.all(promises)
  return balanceResults
}

/**
 * ZEN Card cooperative shares data from /check_zencard API
 * Returns the 3x1/3 distribution history (TREASURY/RnD/ASSETS)
 */
export interface ZenCardShares {
  totalReceivedZen: number // Total cooperative shares acquired (lifetime)
  validBalanceZen: number // Currently valid shares (after expiration)
  totalTransfers: number // Number of share distributions received
  validTransfers: number // Number of still-valid distributions
}

/**
 * Fetch ZEN Card cooperative shares history from /check_zencard API
 * Shows the sum of all 3x1/3 distributions received by this ZEN Card
 * @param email - ZEN Card holder email (required by API)
 * @returns Promise<ZenCardShares | null>
 */
export async function checkZenCardShares(email: string): Promise<ZenCardShares | null> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const apiUrl = getApiServerUrl()
    const response = await fetch(
      `${apiUrl}/check_zencard?email=${encodeURIComponent(email)}`,
      {
        method: "GET",
        headers: {Accept: "application/json"},
        signal: controller.signal,
      },
    )

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()

    return {
      totalReceivedZen: data.total_received_zen ?? 0,
      validBalanceZen: data.valid_balance_zen ?? 0,
      totalTransfers: data.total_transfers ?? 0,
      validTransfers: data.valid_transfers ?? 0,
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      console.error("Timeout checking ZEN Card shares for", email)
    } else {
      console.error("Error checking ZEN Card shares:", error)
    }
    return null
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * Global store for the current user's MULTIPASS ZEN balance (from g1v2 SS58).
 * Used to limit the amount of ZEN that can be sent via likes.
 */
export const myZenBalance = writable<number>(0)

let myBalanceFetchPending = false

/**
 * Refresh the current user's MULTIPASS ZEN balance.
 * Prefers g1v2 (SS58) address — the MULTIPASS on Duniter v2s.
 * @param identities - The current user's profile identities
 */
export async function refreshMyZenBalance(identities: ProfileIdentities) {
  if (myBalanceFetchPending) return
  myBalanceFetchPending = true

  try {
    const address =
      identities.g1v2?.trim() || identities.g1pub?.split(":")[0] || null
    if (!address) return

    const balance = await checkZenBalance(address)
    if (balance) {
      myZenBalance.set(balance.zenBalance)
    }
  } finally {
    myBalanceFetchPending = false
  }
}

/** Preset ZEN amounts for the like selector */
export const ZEN_LIKE_PRESETS = [1, 5, 10, 50, 100] as const

