import {nth, find, last} from "ramda"
import {ellipsize} from "hurdak"
import {nip19} from "nostr-tools"
import {fuzzy} from "src/util/misc"
import {findReplyAndRootIds} from 'src/util/nostr'
import type {Event} from "src/engine/events/model"
import type {Person, Handle} from "./model"
import {people} from "./state"

export const personHasName = ({profile: p}: Person) => Boolean(p?.name || p?.display_name)

export const getPersonWithDefault = pubkey => ({pubkey, ...people.key(pubkey).get()})

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

export const displayHandle = (handle: Handle) =>
  handle.address.startsWith("_@") ? last(handle.address.split("@")) : handle.address

export const displayPubkey = (pubkey: string) => displayPerson(getPersonWithDefault(pubkey))

export const getPeopleSearch = $people =>
  fuzzy($people, {
    keys: [
      "profile.name",
      "profile.display_name",
      {name: "profile.nip05", weight: 0.5},
      {name: "about", weight: 0.1},
    ],
    threshold: 0.3,
  })

export const getMutes = $person => new Set(($person?.mutes || []).map(nth(1)) as string[])

export const getFollows = $person => new Set(($person?.petnames || []).map(nth(1)) as string[])

export const getNetwork = $person => {
  const pubkeys = getFollows($person)
  const network = new Set<string>()

  for (const follow of pubkeys) {
    for (const [_, pubkey] of people.key(follow).get()?.petnames || []) {
      if (!pubkeys.has(pubkey)) {
        network.add(pubkey)
      }
    }
  }

  return network
}

export const isEventMuted = ($mutes, e: Event) => {
  const {reply, root} = findReplyAndRootIds(e)

  return Boolean(find(t => $mutes.has(t), [e.id, e.pubkey, reply, root]))
}
