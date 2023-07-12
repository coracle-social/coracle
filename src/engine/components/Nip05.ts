import {last} from "ramda"
import {nip05} from "nostr-tools"
import {tryFunc, now, tryJson} from "src/util/misc"
import type {Handle} from "src/engine/types"
import {collection} from "../util/store"

export function contributeState() {
  return {
    handles: collection<Handle>(),
  }
}

export function contributeSelectors(engine) {
  const displayHandle = handle =>
    handle.address.startsWith("_@") ? last(handle.address.split("@")) : handle.address

  return {displayHandle}
}

export function initialize({Events, Nip05}) {
  Events.addHandler(0, e => {
    tryJson(async () => {
      const kind0 = JSON.parse(e.content)
      const handle = Nip05.handles.getKey(e.pubkey)

      if (!kind0.nip05 || e.created_at < handle?.created_at) {
        return
      }

      const profile = await tryFunc(() => nip05.queryProfile(kind0.nip05), true)

      if (profile?.pubkey !== e.pubkey) {
        return
      }

      Nip05.handles.setKey(e.pubkey, {
        profile: profile,
        pubkey: e.pubkey,
        address: kind0.nip05,
        created_at: e.created_at,
        updated_at: now(),
      })
    })
  })
}
