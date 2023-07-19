import {last} from "ramda"
import {nip05} from "nostr-tools"
import {tryFunc} from "hurdak"
import {now, tryJson} from "src/util/misc"
import type {Handle} from "src/engine/types"
import {collection} from "../util/store"

export class Nip05 {
  static contributeState() {
    return {
      handles: collection<Handle>("pubkey"),
    }
  }

  static contributeSelectors({Nip05}) {
    const getHandle = pubkey => Nip05.handles.key(pubkey).get()

    const displayHandle = handle =>
      handle.address.startsWith("_@") ? last(handle.address.split("@")) : handle.address

    return {getHandle, displayHandle}
  }

  static initialize({Events, Nip05}) {
    Events.addHandler(0, e => {
      tryJson(async () => {
        const kind0 = JSON.parse(e.content)
        const handle = Nip05.handles.key(e.pubkey)

        if (!kind0.nip05 || e.created_at < handle.get()?.created_at) {
          return
        }

        const profile = await tryFunc(() => nip05.queryProfile(kind0.nip05), true)

        if (profile?.pubkey !== e.pubkey) {
          return
        }

        handle.set({
          profile: profile,
          pubkey: e.pubkey,
          address: kind0.nip05,
          created_at: e.created_at,
          updated_at: now(),
        })
      })
    })
  }
}
