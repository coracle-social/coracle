import {appDataKeys} from "src/util/nostr"
import {settings} from "src/engine2/state"
import {canSign} from "src/engine2/queries"
import {setAppData} from "./nip78"

export const publishSettings = async (updates: Record<string, any>) => {
  settings.update($settings => ({...$settings, ...updates}))

  if (canSign.get()) {
    setAppData(appDataKeys.USER_SETTINGS, settings.get())
  }
}
