import type {TrustedEvent, Wallet} from "@welshman/util"
import type {StoredSession} from "src/engine/core"

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

export type SessionWithMeta = StoredSession & {
  onboarding_tasks_completed?: string[]
  wallet?: Wallet
}

export type AnonymousUserState = {
  follows: string[][]
  relays: string[][]
}
