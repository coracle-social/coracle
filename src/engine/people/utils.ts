import {nip19} from "nostr-tools"
import {throttle} from "throttle-debounce"
import {fromNostrURI, cached} from "paravel"
import {uniq, join, nth, last} from "ramda"
import {Fetch, tryFunc, createMapOf, ellipsize, switcherFn} from "hurdak"
import logger from "src/util/logger"
import {createBatcher, pushToKey} from "src/util/misc"
import {dufflepud} from "src/engine/session/utils"
import {hints} from "src/engine/relays/utils"
import type {Person, Handle} from "./model"
import {people} from "./state"

export const fetchHandle = createBatcher(500, async (handles: string[]) => {
  const data =
    (await tryFunc(async () => {
      const res = await Fetch.postJson(dufflepud("handle/info"), {handles: uniq(handles)})

      return res?.data
    })) || []

  const infoByHandle = createMapOf("handle", "info", data)

  return handles.map(h => infoByHandle[h])
})

export const getHandle = cached({
  maxSize: 100,
  getKey: ([handle]) => handle,
  getValue: ([handle]) => fetchHandle(handle),
})

export const personHasName = ({profile: p}: Person) => Boolean(p?.name || p?.display_name)

export const getPersonWithDefault = pubkey => ({pubkey, ...people.key(pubkey).get()})

export const displayNpub = pubkey => {
  const d = nip19.npubEncode(pubkey)

  return d.slice(0, 8) + "…" + d.slice(-5)
}

export const displayPerson = ({pubkey, profile}: Person) => {
  if (profile) {
    const {display_name, name} = profile

    if (name) {
      return ellipsize(name, 60)
    }

    if (display_name) {
      return ellipsize(display_name, 60)
    }
  }

  try {
    return displayNpub(pubkey)
  } catch (e) {
    logger.error(e)

    return ""
  }
}

export const displayHandle = (handle: Handle) =>
  handle.address.startsWith("_@") ? last(handle.address.split("@")) : handle.address

export const displayPubkey = (pubkey: string) => displayPerson(getPersonWithDefault(pubkey))

export const getMutedPubkeys = $person =>
  ($person?.mutes || []).map(nth(1)).filter(pk => pk?.length === 64) as string[]

export const getMutes = $person => new Set(getMutedPubkeys($person))

export const isMuting = ($person, pubkey) => getMutedPubkeys($person).includes(pubkey)

export const getFollowedPubkeys = $person =>
  ($person?.petnames || []).map(nth(1)).filter(pk => pk?.length === 64) as string[]

export const getFollows = $person => new Set(getFollowedPubkeys($person))

export const isFollowing = ($person, pubkey) => getFollowedPubkeys($person).includes(pubkey)

export const getFollowers = cached({
  maxSize: Infinity,
  getKey: join(":"),
  getValue: ([pk]) => people.get().filter($p => isFollowing($p, pk)),
})

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
  maxSize: Infinity,
  getKey: join(":"),
  getValue: ([pk, tpk]) =>
    getFollowedPubkeys(people.key(pk).get()).filter(pk => isFollowing(people.key(pk).get(), tpk)),
})

export const getFollowsWhoMute = cached({
  maxSize: Infinity,
  getKey: join(":"),
  getValue: ([pk, tpk]) =>
    getFollowedPubkeys(people.key(pk).get()).filter(pk => isMuting(people.key(pk).get(), tpk)),
})

export const primeWotCaches = throttle(3000, pk => {
  const mutes: Record<string, string[]> = {}
  const follows: Record<string, string[]> = {}

  // Get follows mutes from the current user's follows list
  for (const followPk of Array.from(getFollows(people.key(pk).get()))) {
    const follow = people.key(followPk).get()

    for (const mutedPk of Array.from(getMutes(follow))) {
      pushToKey(mutes, mutedPk, followPk)
    }

    for (const followedPk of Array.from(getFollows(follow))) {
      pushToKey(follows, followedPk, followPk)
    }
  }

  // Populate mutes cache
  for (const [k, pubkeys] of Object.entries(mutes)) {
    getFollowsWhoMute.cache.set(getFollowsWhoMute.getKey([pk, k]), pubkeys)
  }

  // Populate follows cache
  for (const [k, pubkeys] of Object.entries(follows)) {
    getFollowsWhoFollow.cache.set(getFollowsWhoFollow.getKey([pk, k]), pubkeys)
  }

  // For everyone else in our database, populate an empty list
  for (const person of people.get()) {
    if (!mutes[person.pubkey]) {
      getFollowsWhoMute.cache.set(getFollowsWhoMute.getKey([pk, person.pubkey]), [])
    }

    if (!follows[person.pubkey]) {
      getFollowsWhoFollow.cache.set(getFollowsWhoFollow.getKey([pk, person.pubkey]), [])
    }
  }
})

export const getWotScore = (pk, tpk) => {
  if (!people.key(pk).exists()) {
    return getFollowers(tpk).length
  }

  const follows = getFollowsWhoFollow(pk, tpk)
  const mutes = getFollowsWhoMute(pk, tpk)

  return follows.length - Math.floor(Math.pow(2, Math.log(mutes.length)))
}

const annotatePerson = pubkey => {
  const relays = hints.FromPubkeys([pubkey]).getUrls()

  return {
    pubkey,
    npub: nip19.npubEncode(pubkey),
    nprofile: nip19.nprofileEncode({pubkey, relays}),
    relays,
  }
}

export const decodePerson = entity => {
  entity = fromNostrURI(entity)

  let type, data
  try {
    ;({type, data} = nip19.decode(entity))
  } catch (e) {
    return annotatePerson(entity)
  }

  return switcherFn(type, {
    nprofile: () => ({
      pubkey: data.pubkey,
      relays: data.relays,
      npub: nip19.npubEncode(data.pubkey),
      nprofile: nip19.nprofileEncode(data),
    }),
    npub: () => annotatePerson(data),
    default: () => annotatePerson(entity),
  })
}
