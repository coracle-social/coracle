import {nip19} from "nostr-tools"
import {ellipsize} from "hurdak/lib/hurdak"
import {tryJson, now, fuzzy} from "src/util/misc"
import {Table, watch} from "src/util/loki"
import type {System} from "src/system/system"
import type {Readable} from "svelte/store"
import type {Profile} from "src/system/types"

export class Directory {
  system: System
  profiles: Table<Profile>
  searchProfiles: Readable<(q: string) => Record<string, any>[]>
  constructor(system) {
    this.system = system

    this.profiles = new Table(this.system.key("directory/profiles"), "pubkey", {
      max: 5000,
      sort: this.system.sortByGraph,
    })

    this.searchProfiles = watch(this.profiles, () => {
      return fuzzy(this.getNamedProfiles(), {
        keys: ["name", "display_name", {name: "nip05", weight: 0.5}, {name: "about", weight: 0.1}],
        threshold: 0.3,
      })
    })

    this.system.sync.addHandler(0, e => {
      tryJson(() => {
        const kind0 = JSON.parse(e.content)
        const profile = this.profiles.get(e.pubkey)

        if (e.created_at < profile?.created_at) {
          return
        }

        this.profiles.patch({
          ...kind0,
          pubkey: e.pubkey,
          created_at: e.created_at,
          updated_at: now(),
        })
      })
    })
  }

  getProfile = (pubkey: string): Profile => this.profiles.get(pubkey) || {pubkey}

  getNamedProfiles = () =>
    this.profiles.all({
      $or: [
        {name: {$type: "string"}},
        {nip05: {$type: "string"}},
        {display_name: {$type: "string"}},
      ],
    })

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

  displayPubkey = pubkey => this.displayProfile(this.getProfile(pubkey))
}
