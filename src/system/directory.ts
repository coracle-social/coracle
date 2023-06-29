import {tryJson} from "src/util/misc"
import {Table} from "src/agent/db"

export default ({keys, sync, cmd, getUserWriteRelays, sortByGraph}) => {
  const profiles = new Table("directory/profiles", "pubkey", {max: 5000, sort: sortByGraph})

  sync.addHandler(0, e => {
    tryJson(() => {
      const kind0 = JSON.parse(e.content)
      const profile = profiles.get(e.pubkey)

      if (e.created_at < profile?.created_at) {
        return
      }

      profiles.patch({
        ...kind0,
        pubkey: e.pubkey,
        created_at: e.created_at,
      })
    })
  })

  return {
    profiles,
  }
}
