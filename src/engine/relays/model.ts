export type RelayInfo = {
  contact?: string
  description?: string
  last_checked?: number
  supported_nips?: number[]
  limitation?: {
    payment_required?: boolean
    auth_required?: boolean
  }
}

export type Relay = {
  url: string
  count?: number
  first_seen?: number
  info?: RelayInfo
}

export enum RelayMode {
  Read = "read",
  Write = "write",
}

export type RelayPolicy = {
  url: string
  read: boolean
  write: boolean
}
