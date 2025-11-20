import {getRelayQuality} from "@welshman/app"
import {AuthStatus, Socket, PublishStatus, SocketStatus} from "@welshman/net"
import {derived, writable} from "svelte/store"

export type PublishNotice = {
  eventId: string
  created_at: number
  eventKind: string
  message: string
  status: PublishStatus
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

export enum ConnectionType {
  Connected,
  Logging,
  LoginFailed,
  ConnectFailed,
  WaitReconnect,
  NotConnected,
  UnstableConnection,
}

export const getSocketStatus = (socket: Socket): ConnectionType => {
  if (pendingStatuses.includes(socket.auth.status)) {
    return ConnectionType.Logging
  } else if (failureStatuses.includes(socket.auth.status)) {
    return ConnectionType.LoginFailed
  } else if (socket.status === SocketStatus.Error) {
    return ConnectionType.ConnectFailed
  } else if (socket.status === SocketStatus.Closed) {
    return ConnectionType.WaitReconnect
  } else if (getRelayQuality(socket.url) < 0.5) {
    return ConnectionType.UnstableConnection
  } else {
    return ConnectionType.Connected
  }
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
      return "Waiting to reconnect"
    case ConnectionType.NotConnected:
      return "Not connected"
    case ConnectionType.UnstableConnection:
      return "Unstable connection"
  }
}
