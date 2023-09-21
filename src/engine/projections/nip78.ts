import {tryFunc} from "hurdak"
import {Tags, appDataKeys} from "src/util/nostr"
import {sessions} from "src/engine/state"
import {nip04} from "src/engine/queries"
import {projections, updateRecord} from "src/engine/projections/core"

projections.addHandler(30078, e => {
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
