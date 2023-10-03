import {join, nth, last} from "ramda"
import {ellipsize} from "hurdak"
import {nip19} from "nostr-tools"
import {fuzzy} from "src/util/misc"
import {cached} from "src/util/lruCache"
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

export const getMutedPubkeys = $person => ($person?.mutes || []).map(nth(1)) as string[]

export const getMutes = $person => new Set(getMutedPubkeys($person))

export const getFollowedPubkeys = $person => ($person?.petnames || []).map(nth(1)) as string[]

export const getFollows = $person => new Set(getFollowedPubkeys($person))

export const isFollowing = ($person, pubkey) => getFollowedPubkeys($person).includes(pubkey)

export const getFollowers = pubkey => people.get().filter($p => isFollowing($p, pubkey))

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

export const getFollowsWhoFollow = cached({
  maxSize: 1000,
  getKey: join(":"),
  getValue: ([pk, tpk]) =>
    getFollowedPubkeys(people.key(pk).get()).filter(pk => isFollowing(people.key(pk).get(), tpk)),
})
