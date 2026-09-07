import {AuthStatus, Socket, PublishStatus, SocketStatus} from "@welshman/net"
import {writable} from "svelte/store"
import {relayStats} from "src/engine/core"

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
  } else if (relayStats.get().getQuality(socket.url) < 0.5) {
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
