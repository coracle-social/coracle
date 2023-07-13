import {nip19} from "nostr-tools"
import {ellipsize} from "hurdak/lib/hurdak"
import {tryJson, now, fuzzy} from "src/util/misc"
import type {Profile} from "src/engine/types"
import {collection, derived} from "../util/store"

export class Directory {
  static contributeState() {
    const profiles = collection<Profile>("pubkey")

    return {profiles}
  }

  static contributeSelectors({Directory}) {
    const getProfile = (pubkey: string): Profile => Directory.profiles.key(pubkey).get() || {pubkey}

    const getNamedProfiles = () =>
      Directory.profiles.get().filter(p => p.name || p.nip05 || p.display_name)

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

  static initialize({Events, Directory}) {
    Events.addHandler(0, e => {
      tryJson(() => {
        const kind0 = JSON.parse(e.content)
        const profile = Directory.profiles.key(e.pubkey)

        if (e.created_at < profile.get()?.created_at) {
          return
        }

        profile.merge({
          ...kind0,
          created_at: e.created_at,
          updated_at: now(),
        })
      })
    })
  }
}
