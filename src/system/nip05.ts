import {last} from "ramda"
import {nip05} from "nostr-tools"
import {tryFunc, tryJson} from "src/util/misc"
import {Table} from "src/util/loki"

export default ({sync, sortByGraph}) => {
  const handles = new Table("nip05/handles", "pubkey", {max: 5000, sort: sortByGraph})

  sync.addHandler(0, e => {
    tryJson(async () => {
      const kind0 = JSON.parse(e.content)
      const handle = handles.get(e.pubkey)

      if (!kind0.nip05 || e.created_at < handle?.created_at) {
        return
      }

      const profile = await tryFunc(() => nip05.queryProfile(kind0.nip05), true)

      if (profile?.pubkey !== e.pubkey) {
        return
      }

      handles.patch({
        profile: profile,
        pubkey: e.pubkey,
        address: kind0.nip05,
        created_at: e.created_at,
      })
    })
  })

  const getHandle = pubkey => handles.get(pubkey)

  const displayHandle = handle =>
    handle.address.startsWith("_@") ? last(handle.address.split("@")) : handle.address

  return {
    handles,
    getHandle,
    displayHandle,
  }
}
