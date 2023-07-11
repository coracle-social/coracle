import {last} from "ramda"
import {nip05} from "nostr-tools"
import {tryFunc, now, tryJson} from "src/util/misc"
import type {Table} from "src/util/loki"
import type {Sync} from "src/system/components/Sync"
import type {Handle} from "src/system/types"

export class Nip05 {
  handles: Table<Handle>
  constructor(sync: Sync) {
    this.handles = sync.table("nip05/handles", "pubkey", {
      max: 5000,
      sort: sync.sortByPubkeyWhitelist,
    })

    sync.addHandler(0, e => {
      tryJson(async () => {
        const kind0 = JSON.parse(e.content)
        const handle = this.handles.get(e.pubkey)

        if (!kind0.nip05 || e.created_at < handle?.created_at) {
          return
        }

        const profile = await tryFunc(() => nip05.queryProfile(kind0.nip05), true)

        if (profile?.pubkey !== e.pubkey) {
          return
        }

        this.handles.patch({
          profile: profile,
          pubkey: e.pubkey,
          address: kind0.nip05,
          created_at: e.created_at,
          updated_at: now(),
        })
      })
    })
  }

  getHandle = pubkey => this.handles.get(pubkey)

  displayHandle = handle =>
    handle.address.startsWith("_@") ? last(handle.address.split("@")) : handle.address
}
