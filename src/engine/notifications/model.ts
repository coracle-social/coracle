import type {Event} from "src/engine/events/model"

export type Notification = {
  key: string
  event: Event
  timestamp: number
  interactions: Event[]
}

export enum OnboardingTask {
  BackupKey = "backup_key",
  SetupWallet = "setup_wallet",
}
