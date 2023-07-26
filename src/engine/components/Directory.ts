import {nip19} from "nostr-tools"
import {omit} from "ramda"
import {ellipsize} from "hurdak"
import {tryJson, now, fuzzy} from "src/util/misc"
import {collection, derived} from "src/engine/util/store"
import type {Engine} from "src/engine/Engine"
import type {Event, Profile} from "src/engine/types"

export class Directory {
  profiles = collection<Profile>("pubkey")

  getProfile = (pubkey: string): Profile => this.profiles.key(pubkey).get() || {pubkey}

  getNamedProfiles = () => this.profiles.get().filter(p => p.name || p.nip05 || p.display_name)

  displayProfile = ({display_name, name, pubkey}: Profile) => {
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

  displayPubkey = (pubkey: string) => this.displayProfile(this.getProfile(pubkey))

  searchProfiles = derived(this.profiles, $profiles => {
    return fuzzy(this.getNamedProfiles(), {
      keys: ["name", "display_name", {name: "nip05", weight: 0.5}, {name: "about", weight: 0.1}],
      threshold: 0.3,
    })
  })

  initialize(engine: Engine) {
    engine.Events.addHandler(0, (e: Event) => {
      tryJson(() => {
        const kind0 = omit(["pubkey"], JSON.parse(e.content))
        const profile = this.profiles.key(e.pubkey)

        if (e.created_at < (profile.get()?.created_at || 0)) {
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
