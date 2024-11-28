import {AuthStatus, SocketStatus, type Connection} from "@welshman/net"
import {getRelayQuality} from "@welshman/app"
import {ConnectionType} from "src/engine"

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
