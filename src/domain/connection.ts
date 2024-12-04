import {getRelayQuality, type ThunkStatus} from "@welshman/app"
import {AuthStatus, Connection, SocketStatus} from "@welshman/net"
import {derived, writable} from "svelte/store"

export type PublishNotice = {
  eventId: string
  created_at: number
  eventKind: number
  message: string
  status: ThunkStatus
  url: string
}

export type SubscriptionNotice = {created_at: number; url: string; notice: string[]}

export const subscriptionNotices = writable<Map<string, SubscriptionNotice[]>>(new Map())

export const subscriptionNoticesByRelay = derived(subscriptionNotices, $notices => {
  return $notices.values()
})

const pendingStatuses = [
  AuthStatus.Requested,
  AuthStatus.PendingSignature,
  AuthStatus.PendingResponse,
]

const failureStatuses = [AuthStatus.DeniedSignature, AuthStatus.Forbidden]

export const getConnectionStatus = (cxn: Connection): ConnectionType => {
  if (pendingStatuses.includes(cxn.auth.status)) {
    return ConnectionType.Logging
  } else if (failureStatuses.includes(cxn.auth.status)) {
    return ConnectionType.LoginFailed
  } else if (cxn.socket.status === SocketStatus.Error) {
    return ConnectionType.ConnectFailed
  } else if (cxn.socket.status === SocketStatus.Closed) {
    return ConnectionType.WaitReconnect
  } else if (cxn.socket.status === SocketStatus.New) {
    return ConnectionType.NotConnected
  } else if (getRelayQuality(cxn.url) < 0.5) {
    return ConnectionType.UnstableConnection
  } else {
    return ConnectionType.Connected
  }
}

export enum ConnectionType {
  Connected,
  Logging,
  LoginFailed,
  ConnectFailed,
  WaitReconnect,
  NotConnected,
  UnstableConnection,
}

export const displayConnectionType = (type: ConnectionType) => {
  switch (type) {
    case ConnectionType.Connected:
      return "Connected"
    case ConnectionType.Logging:
      return "Logging in"
    case ConnectionType.LoginFailed:
      return "Failed to log in"
    case ConnectionType.ConnectFailed:
      return "Failed to connect"
    case ConnectionType.WaitReconnect:
      return "Wainting to reconnect"
    case ConnectionType.NotConnected:
      return "Not connected"
    case ConnectionType.UnstableConnection:
      return "Unstable connection"
  }
}
