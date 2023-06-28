import {sortBy, reject, prop} from "ramda"
import {get} from "svelte/store"
import {ensurePlural} from "hurdak/lib/hurdak"
import {now} from "src/util/misc"
import {Tags} from "src/util/nostr"
import {Table} from "src/agent/db"

export default ({keys, sync, cmd, getUserWriteRelays}) => {
  // Don't delete the user's own info or those of direct follows
  const sortByGraph = xs => {
    const pubkey = keys.getPubkey()

    if (pubkey) {
      const whitelist = new Set(graph.all({pubkey}).follows.concat(pubkey))

      return sortBy(x => (whitelist.has(x.pubkey) ? 0 : x.created_at), xs)
    } else {
      return sortBy(prop("created_at"))
    }
  }

  const graph = new Table("social/graph", "pubkey", {max: 5000, sort: sortByGraph})

  sync.addHandler(3, e => {
    const entry = graph.get(e.pubkey)

    if (e.created_at < entry?.created_at) {
      return
    }

    graph.patch({
      pubkey: e.pubkey,
      created_at: e.created_at,
      petnames: Tags.from(e).type("p").all(),
    })
  })

  const getPetnames = pubkey => graph.get(pubkey)?.petnames || []

  const getPetnamePubkeys = pubkey => getPetnames(pubkey).map(t => t[1])

  const getFollowsSet = pubkeys => {
    const follows = new Set()

    for (const pubkey of ensurePlural(pubkeys)) {
      for (const follow of getPetnamePubkeys(pubkey)) {
        follows.add(follow)
      }
    }

    return follows
  }

  const getFollows = pubkeys => Array.from(getFollowsSet(pubkeys))

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

  const getUserKey = () => keys.getPubkey() || "anonymous"
  const getUserPetnames = () => getPetnames(getUserKey())
  const getUserPetnamePubkeys = () => getPetnamePubkeys(getUserKey())
  const getUserFollows = () => getFollows(getUserKey())
  const getUserNetwork = () => getNetwork(getUserKey())
  const isUserFollowing = pubkey => isFollowing(getUserKey(), pubkey)

  const updatePetnames = async $petnames => {
    if (get(keys.canSign)) {
      await cmd.setPetnames($petnames).publish(getUserWriteRelays())
    } else {
      graph.patch({
        pubkey: getUserKey(),
        created_at: now(),
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

  return {
    graph,
    getPetnames,
    getPetnamePubkeys,
    getFollows,
    getNetwork,
    isFollowing,
    getUserPetnames,
    getUserPetnamePubkeys,
    getUserFollows,
    getUserNetwork,
    isUserFollowing,
    follow,
    unfollow,
    sortByGraph,
  }
}
