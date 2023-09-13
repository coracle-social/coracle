import {tryJson} from "src/util/misc"
import {Tags, appDataKeys} from "src/util/nostr"
import {settings} from "src/engine2/state"
import {getSetting, canSign, nip04, user} from "src/engine2/queries"
import {projections} from "src/engine2/projections/core"

projections.addHandler(30078, e => {
  if (
    canSign.get() &&
    Tags.from(e).getMeta("d") === appDataKeys.USER_SETTINGS &&
    e.created_at > getSetting("updated_at")
  ) {
    tryJson(async () => {
      const updates = JSON.parse(await nip04.get().decryptAsUser(e.content, user.get().pubkey))

      settings.update($settings => ({
        ...$settings,
        ...updates,
        updated_at: e.created_at,
      }))
    })
  }
})
