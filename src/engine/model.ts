import type {TrustedEvent} from "@welshman/util"
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

// A stored session plus coracle's own per-account metadata, which rides alongside welshman's
// serializable {method, data} rather than inside it.
export type SessionWithMeta = StoredSession & {
  onboarding_tasks_completed?: string[]
}

export type AnonymousUserState = {
  follows: string[][]
  relays: string[][]
}
