import {sortBy, slice, reject, prop} from "ramda"
import {get} from "svelte/store"
import {ensurePlural} from "hurdak/lib/hurdak"
import {now} from "src/util/misc"
import {Tags, findReplyId, findRootId} from "src/util/nostr"
import {Table} from "src/agent/db"

export default ({keys, sync, getCmd, getUserWriteRelays}) => {
  // Don't delete the user's own info or those of direct follows
  const sortByGraph = xs => {
    const pubkey = keys.getPubkey()

    if (pubkey) {
      const whitelist = new Set(graph.all({pubkey}).follows.concat(pubkey))

      return sortBy(x => (whitelist.has(x.pubkey) ? 0 : x.updated_at), xs)
    } else {
      return sortBy(prop("updated_at"))
    }
  }

  const graph = new Table("social/graph", "pubkey", {max: 5000, sort: sortByGraph})

  sync.addHandler(3, e => {
    const entry = graph.get(e.pubkey)

    if (e.created_at < entry?.petnames_updated_at) {
      return
    }

    graph.patch({
      pubkey: e.pubkey,
      petnames_updated_at: e.created_at,
      petnames: Tags.from(e).type("p").all(),
    })
  })

  sync.addHandler(10000, e => {
    const entry = graph.get(e.pubkey)

    if (e.created_at < entry?.mutes_updated_at) {
      return
    }

    graph.patch({
      pubkey: e.pubkey,
      mutes_updated_at: e.created_at,
      mutes: Tags.from(e).type("p").all(),
    })
  })

  const getPetnames = pubkey => graph.get(pubkey)?.petnames || []

  const getMutedTags = pubkey => graph.get(pubkey)?.mutes || []

  const getFollowsSet = pubkeys => {
    const follows = new Set()

    for (const pubkey of ensurePlural(pubkeys)) {
      for (const tag of getPetnames(pubkey)) {
        follows.add(tag[1])
      }
    }

    return follows
  }

  const getMutesSet = pubkeys => {
    const mutes = new Set()

    for (const pubkey of ensurePlural(pubkeys)) {
      for (const tag of getMutedTags(pubkey)) {
        mutes.add(tag[1])
      }
    }

    return mutes
  }

  const getFollows = pubkeys => Array.from(getFollowsSet(pubkeys))

  const getMutes = pubkeys => Array.from(getMutesSet(pubkeys))

  const getNetworkSet = (pubkeys, includeFollows = false) => {
    const follows = getFollowsSet(pubkeys)
    const network = includeFollows ? follows : new Set()

    for (const pubkey of getFollows(follows)) {
      if (!follows.has(pubkey)) {
        network.add(pubkey)
      }
    }

    return network
  }

  const getNetwork = pubkeys => Array.from(getNetworkSet(pubkeys))

  const isFollowing = (a, b) => getFollowsSet(a).has(b)
  const isIgnoring = (a, b) => getMutesSet(a).has(b)

  const getUserKey = () => keys.getPubkey() || "anonymous"
  const getUserPetnames = () => getPetnames(getUserKey())
  const getUserMutedTags = () => getMutedTags(getUserKey())
  const getUserFollowsSet = () => getFollowsSet(getUserKey())
  const getUserMutesSet = () => getMutesSet(getUserKey())
  const getUserFollows = () => getFollows(getUserKey())
  const getUserMutes = () => getMutes(getUserKey())
  const getUserNetworkSet = () => getNetworkSet(getUserKey())
  const getUserNetwork = () => getNetwork(getUserKey())
  const isUserFollowing = pubkey => isFollowing(getUserKey(), pubkey)
  const isUserIgnoring = pubkeyOrEventId => isIgnoring(getUserKey(), pubkeyOrEventId)

  const updatePetnames = async $petnames => {
    if (get(keys.canSign)) {
      await getCmd().setPetnames($petnames).publish(getUserWriteRelays())
    } else {
      graph.patch({
        pubkey: getUserKey(),
        petnames_updated_at: now(),
        petnames: $petnames,
      })
    }
  }

  const follow = (pubkey, url, name) =>
    updatePetnames(
      getUserPetnames()
        .filter(t => t[1] !== pubkey)
        .concat([["p", pubkey, url, name || ""]])
    )

  const unfollow = pubkey => updatePetnames(reject(t => t[1] === pubkey, getUserPetnames()))

  const isMuted = e => {
    const m = getUserMutesSet()
    const muted = m.has(e.id) || m.has(e.pubkey) || m.has(findReplyId(e)) || m.has(findRootId(e))

    return !muted
  }

  const applyMutes = events => events.filter(isMuted)

  const updateMutes = async $mutes => {
    if (get(keys.canSign)) {
      await getCmd()
        .setMutes($mutes.map(slice(0, 2)))
        .publish(getUserWriteRelays())
    } else {
      graph.patch({
        pubkey: getUserKey(),
        mutes_updated_at: now(),
        mutes: $mutes,
      })
    }
  }

  const mute = (type, value) =>
    updateMutes(reject(t => t[1] === value, getUserMutes()).concat([[type, value]]))

  const unmute = pubkey => updateMutes(reject(t => t[1] === pubkey, getUserMutes()))

  return {
    graph,
    getPetnames,
    getMutedTags,
    getFollowsSet,
    getMutesSet,
    getFollows,
    getMutes,
    getNetworkSet,
    getNetwork,
    isFollowing,
    isIgnoring,
    getUserPetnames,
    getUserMutedTags,
    getUserFollowsSet,
    getUserMutesSet,
    getUserFollows,
    getUserNetworkSet,
    getUserNetwork,
    isUserFollowing,
    isUserIgnoring,
    updatePetnames,
    follow,
    unfollow,
    isMuted,
    applyMutes,
    updateMutes,
    mute,
    unmute,
    sortByGraph,
  }
}
