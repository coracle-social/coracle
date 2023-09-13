import {appDataKeys} from "src/util/nostr"
import {settings, session} from "src/engine2/state"
import {canSign, nip04} from "src/engine2/queries"
import {publishEvent} from "./util"

export const setAppData = async (d: string, data: any) => {
  if (canSign.get()) {
    const {pubkey} = session.get()
    const json = JSON.stringify(data)
    const content = await nip04.get().encryptAsUser(json, pubkey)

    return publishEvent(30078, {content, tags: [["d", d]]})
  }
}

export const publishSettings = async (updates: Record<string, any>) => {
  settings.update($settings => ({...$settings, ...updates}))
  setAppData(appDataKeys.USER_SETTINGS, settings.get())
}
