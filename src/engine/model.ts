import type {Session} from "@welshman/app"
import type {Publish} from "@welshman/net"
import type {TrustedEvent, Zapper as WelshmanZapper} from "@welshman/util"

export type Zapper = WelshmanZapper & {
  lnurl: string
  pubkey: string
}

export type PublishInfo = Omit<Publish, "emitter" | "result">

export type Notification = {
  key: string
  type: string
  root: string
  timestamp: number
  interactions: TrustedEvent[]
}

export enum OnboardingTask {
  BackupKey = "backup_key",
  SetupWallet = "setup_wallet",
}
export type Topic = {
  name: string
  count?: number
  last_seen?: number
}

export type Channel = {
  id: string
  last_sent?: number
  last_received?: number
  last_checked?: number
  messages: TrustedEvent[]
}

export type SessionWithMeta = Session & {
  onboarding_tasks_completed?: string[]
}

export type AnonymousUserState = {
  follows: string[][]
  relays: string[][]
}

export enum ConnectionType {
  Connected = "Connected",
  Logging = "Logging in",
  LoginFailed = "Failed to log in",
  ConnectFailed = "Failed to connect",
  WaitReconnect = "Wainting to reconnect",
  NotConnected = "Not connected",
  UnstableConnection = "Unstable connection",
}
