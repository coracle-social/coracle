import {last} from "ramda"
import {nip05} from "nostr-tools"
import {tryFunc, now, tryJson} from "src/util/misc"
import {Table} from "src/util/loki"
import type {System} from "src/system/system"

export type Handle = {
  profile: Record<string, any>
  pubkey: string
  address: string
  created_at: number
  updated_at: number
}

export class Nip05 {
  system: System
  handles: Table<Handle>
  constructor(system) {
    this.system = system

    this.handles = new Table(system.key("nip05/handles"), "pubkey", {
      sort: system.sortByGraph,
      max: 5000,
    })

    system.sync.addHandler(0, e => {
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
