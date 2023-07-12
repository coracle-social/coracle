import {nip19} from "nostr-tools"
import {ellipsize} from "hurdak/lib/hurdak"
import {tryJson, now, fuzzy} from "src/util/misc"
import type {Profile} from "src/system/types"
import {collection, derived} from "../util/store"

export function contributeState() {
  const profiles = collection<Profile>()

  return {profiles}
}

export function contributeSelectors({Directory}) {
  const getProfile = (pubkey: string): Profile => Directory.profiles.getKey(pubkey) || {pubkey}

  const getNamedProfiles = () =>
    Directory.profiles.all().filter(p => p.name || p.nip05 || p.display_name)

  const displayProfile = ({display_name, name, pubkey}: Profile) => {
    if (display_name) {
      return ellipsize(display_name, 60)
    }

    if (name) {
      return ellipsize(name, 60)
    }

    try {
      return nip19.npubEncode(pubkey).slice(-8)
    } catch (e) {
      console.error(e)

      return ""
    }
  }

  const displayPubkey = pubkey => displayProfile(getProfile(pubkey))

  const searchProfiles = derived(Directory.profiles, $profiles => {
    return fuzzy(getNamedProfiles(), {
      keys: ["name", "display_name", {name: "nip05", weight: 0.5}, {name: "about", weight: 0.1}],
      threshold: 0.3,
    })
  })

  return {getProfile, getNamedProfiles, displayProfile, displayPubkey, searchProfiles}
}

export function initialize({Events, Directory}) {
  Events.addHandler(0, e => {
    tryJson(() => {
      const kind0 = JSON.parse(e.content)
      const profile = Directory.profiles.getKey(e.pubkey)

      if (e.created_at < profile?.created_at) {
        return
      }

      Directory.profiles.mergeKey(e.pubkey, {
        ...kind0,
        pubkey: e.pubkey,
        created_at: e.created_at,
        updated_at: now(),
      })
    })
  })
}
