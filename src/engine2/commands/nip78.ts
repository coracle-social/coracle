import {appDataKeys} from "src/util/nostr"
import {settings} from "src/engine2/state"
import {canSign} from "src/engine2/queries"
import {nip04, user} from "src/engine2/queries"
import {publishEvent} from "./util"

export const setAppData = async (d: string, data: any) => {
  const {pubkey} = user.get()
  const json = JSON.stringify(data)
  const content = await nip04.get().encryptAsUser(json, pubkey)

  return publishEvent(30078, {content, tags: [["d", d]]})
}

export const publishSettings = async (updates: Record<string, any>) => {
  settings.update($settings => ({...$settings, ...updates}))

  if (canSign.get()) {
    setAppData(appDataKeys.USER_SETTINGS, settings.get())
  }
}
