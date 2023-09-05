import {nth, map} from "ramda"
import {ensurePlural} from "hurdak"
import {derived} from "src/engine2/util/store"
import {people} from "src/engine2/state"

export const derivePetnames = (pubkey: string) => people.key(pubkey).derived(g => g?.petnames || [])

export const deriveMutes = (pubkey: string) => people.key(pubkey).derived(g => g?.mutes || [])

export const deriveFollowsSet = (pubkeys: string | string[]) =>
  derived(
    ensurePlural(pubkeys).map(derivePetnames),
    petnameGroups => new Set(petnameGroups.flatMap(map(nth(1))))
  )

export const deriveMutesSet = (pubkeys: string | string[]) =>
  derived(
    ensurePlural(pubkeys).map(deriveMutes),
    petnameGroups => new Set(petnameGroups.flatMap(map(nth(1))))
  )

export const deriveNetworkSet = (pubkeys: string | string[], includeFollows = false) =>
  derived(deriveFollowsSet(pubkeys), ([follows]) => {
    const network = includeFollows ? follows : new Set<string>()

    for (const pubkey of deriveFollowsSet(Array.from(follows)).get()) {
      if (!follows.has(pubkey)) {
        network.add(pubkey)
      }
    }

    return network
  })

export const getFollows = (pubkeys: string | string[]) =>
  Array.from(deriveFollowsSet(pubkeys).get())

export const getMutes = (pubkeys: string | string[]) => Array.from(deriveMutesSet(pubkeys).get())

export const getNetwork = (pubkeys: string | string[]) =>
  Array.from(deriveNetworkSet(pubkeys).get())

export const isFollowing = (a: string, b: string) => deriveFollowsSet(a).get().has(b)

export const isIgnoring = (a: string, b: string) => deriveMutesSet(a).get().has(b)
