// Auto-detection of UPlanet/Astroport services based on deployment context.
// When Coracle is served from an IPFS gateway co-located with Astroport,
// this module derives relay, API, and upload URLs from window.location.
// Returns null when not on a recognized UPlanet gateway — zero impact on standard users.

export interface UPlanetServices {
  relayUrl: string
  apiUrl: string
  uploadUrl: string
  isLocal: boolean
}

let _cached: UPlanetServices | null | undefined
let _verified: UPlanetServices | null = null

const isPrivateIP = (hostname: string) =>
  hostname === "localhost" ||
  hostname === "127.0.0.1" ||
  hostname.startsWith("192.168.") ||
  hostname.startsWith("10.") ||
  hostname.match(/^172\.(1[6-9]|2\d|3[01])\./)

export function detectUPlanetServices(): UPlanetServices | null {
  if (_cached !== undefined) return _cached

  if (typeof globalThis.location === "undefined") {
    _cached = null
    return null
  }

  const {hostname, port, protocol} = globalThis.location
  const isSecure = protocol === "https:"
  const wsProto = isSecure ? "wss" : "ws"
  const httpProto = isSecure ? "https" : "http"

  let relayUrl: string
  let apiUrl: string
  let isLocal = false

  if (hostname.startsWith("ipfs.")) {
    // ipfs.example.com → relay.example.com / u.example.com (SSL proxy handles port)
    const domain = hostname.replace(/^ipfs\./, "")
    relayUrl = `${wsProto}://relay.${domain}`
    apiUrl = `${httpProto}://u.${domain}`
  } else if (isPrivateIP(hostname) && (port === "8080" || port === "")) {
    // Local or LAN IPFS gateway — explicit ports (no SSL proxy)
    relayUrl = `ws://${hostname === "localhost" ? "127.0.0.1" : hostname}:7777`
    apiUrl = `http://${hostname === "localhost" ? "127.0.0.1" : hostname}:54321`
    isLocal = true
  } else {
    _cached = null
    return null
  }

  _cached = {relayUrl, apiUrl, uploadUrl: `${apiUrl}/api/upload/image`, isLocal}
  return _cached
}

export async function verifyUPlanetServices(services: UPlanetServices): Promise<boolean> {
  try {
    const res = await fetch(`${services.apiUrl}/.well-known/nostr/nip96.json`, {
      signal: AbortSignal.timeout(3000),
    })
    if (res.ok) {
      _verified = services
      console.info("[UPlanet] Services detected:", services.relayUrl, services.apiUrl)
      return true
    }
  } catch {
    // ignore
  }

  console.info("[UPlanet] Gateway detected but services unreachable, using defaults")
  _verified = null
  return false
}

export function getVerifiedUPlanet(): UPlanetServices | null {
  return _verified
}
