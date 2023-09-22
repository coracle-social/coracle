export type Session = {
  method: string
  pubkey: string
  privkey?: string
  bunkerKey?: string
  bunkerToken?: string
  settings?: Record<string, any>
  settings_updated_at?: number
}
