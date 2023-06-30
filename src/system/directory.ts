import {nip19} from "nostr-tools"
import {ellipsize} from "hurdak/lib/hurdak"
import {tryJson, fuzzy} from "src/util/misc"
import {Table, watch} from "src/agent/db"

export default ({sync, sortByGraph}) => {
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

  const getProfile = pubkey => profiles.get(pubkey) || {pubkey}

  const getNamedProfiles = () =>
    profiles.all({
      $or: [
        {name: {$type: "string"}},
        {nip05: {$type: "string"}},
        {display_name: {$type: "string"}},
      ],
    })

  const searchProfiles = watch(profiles, () => {
    return fuzzy(getNamedProfiles(), {
      keys: ["name", "display_name", {name: "nip05", weight: 0.5}, {name: "about", weight: 0.1}],
      threshold: 0.3,
    })
  })

  const displayProfile = ({display_name, name, pubkey}) => {
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

  return {
    profiles,
    getProfile,
    getNamedProfiles,
    searchProfiles,
    displayProfile,
    displayPubkey,
  }
}
