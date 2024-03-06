import {tryFunc} from "hurdak"
import {Tags} from "paravel"
import {appDataKeys} from "src/util/nostr"
import {projections} from "src/engine/core/projections"
import {updateRecord} from "src/engine/core/commands"
import {sessions} from "./state"
import {nip04} from "./derived"

projections.addHandler(30078, e => {
  if (Tags.fromEvent(e).get("d")?.value() === appDataKeys.USER_SETTINGS) {
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
