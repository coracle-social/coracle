import {tryFunc} from "hurdak"
import {Tags, appDataKeys} from "src/util/nostr"
import {projections} from "src/engine/core/projections"
import {updateRecord} from "src/engine/core/commands"
import {EventKind} from "src/engine/events/model"
import {sessions} from "./state"
import {nip04} from "./derived"

projections.addHandler(EventKind.AppData, e => {
  if (Tags.from(e).getMeta("d") === appDataKeys.USER_SETTINGS) {
    sessions.updateAsync(async $sessions => {
      if ($sessions[e.pubkey]) {
        await tryFunc(async () => {
          $sessions[e.pubkey] = updateRecord($sessions[e.pubkey], e.created_at, {
            settings: JSON.parse(await nip04.get().decryptAsUser(e.content, e.pubkey)),
          })
        })
      }

      return $sessions
    })
  }
})
