import {defaultTo} from "ramda"
import {ellipsize} from "hurdak"
import {nip19} from "nostr-tools"
import {fuzzy} from "src/util/misc"
import type {Person} from "src/engine2/model"
import {people} from "src/engine2/state"

export const peopleWithName = people.derived($people =>
  $people.filter(({profile: p}) => p.name || p.nip05 || p.display_name)
)

export const derivePerson = pubkey => people.key(pubkey).derived(defaultTo({pubkey}))

export const displayPerson = ({pubkey, profile}: Person) => {
  if (profile) {
    const {display_name, name} = profile

    if (display_name) {
      return ellipsize(display_name, 60)
    }

    if (name) {
      return ellipsize(name, 60)
    }
  }

  try {
    return nip19.npubEncode(pubkey).slice(-8)
  } catch (e) {
    console.error(e)

    return ""
  }
}

export const displayPubkey = (pubkey: string) => displayPerson(derivePerson(pubkey).get())

export const getPeopleSearch = $people =>
  fuzzy($people, {
    keys: ["name", "display_name", {name: "nip05", weight: 0.5}, {name: "about", weight: 0.1}],
    threshold: 0.3,
  })

export const getTopicSearch = $topics => fuzzy($topics, {keys: ["name"], threshold: 0.3})
