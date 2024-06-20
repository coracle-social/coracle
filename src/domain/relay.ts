import {last} from "@welshman/lib"
import {LOCAL_RELAY_URL, normalizeRelayUrl as _normalizeRelayUrl} from "@welshman/util"

// Utils related to bare urls

export function normalizeRelayUrl(url: string, opts = {}) {
  if (url === LOCAL_RELAY_URL) {
    return url
  }

  try {
    return _normalizeRelayUrl(url, opts)
  } catch (e) {
    return url
  }
}

export const displayRelayUrl = (url: string) => last(url.split("://")).replace(/\/$/, "")

// Relay profiles

export type RelayProfile = {
  url: string
  name?: string
  contact?: string
  description?: string
  supported_nips?: number[]
  limitation?: {
    payment_required?: boolean
    auth_required?: boolean
  }
}

export const makeRelayProfile = (relayProfile: RelayProfile) => relayProfile

export const filterRelaysByNip = (nip: number, relays) =>
  relays.filter(r => (r.supported_nips || []).includes(nip))

// Relay policies

export enum RelayMode {
  Read = "read",
  Write = "write",
  Inbox = "inbox",
}

export type RelayPolicy = {
  url: string
  read: boolean
  write: boolean
  inbox: boolean
}

export const makeRelayPolicy = ({
  url,
  ...relayPolicy
}: Partial<RelayPolicy> & {url: string}): RelayPolicy => ({
  url: normalizeRelayUrl(url),
  read: false,
  write: false,
  inbox: false,
  ...relayPolicy,
})
