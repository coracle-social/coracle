import {sortBy, reject, prop} from "ramda"
import {get} from "svelte/store"
import {now, gettable} from "src/util/misc"
import {Tags} from "src/util/nostr"
import {Table, watch} from "src/agent/db"

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

  const graph = new Table("system.social/graph", "pubkey", {max: 5000, sort: sortByGraph})

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

  const getFollows = pubkeys => {
    const follows = new Set()

    for (const pubkey of pubkeys) {
      for (const follow of getPetnamePubkeys(pubkey)) {
        follows.add(follow)
      }
    }

    return follows
  }

  const getNetwork = (pubkeys, includeFollows = false) => {
    const follows = getFollows(pubkeys)
    const network = includeFollows ? follows : new Set()

    for (const pubkey of getFollows(follows)) {
      if (!follows.has(pubkey)) {
        network.add(pubkey)
      }
    }

    return network
  }

  const isFollowing = (a, b) => getFollows(a).has(b)

  const getUserKey = () => keys.getPubkey() || "anonymous"
  const userPetnames = gettable(watch(graph, () => getPetnames(getUserKey())))
  const userPetnamePubkeys = gettable(watch(graph, () => getPetnamePubkeys(getUserKey())))
  const userFollows = gettable(watch(graph, () => getFollows(getUserKey())))
  const userNetwork = gettable(watch(graph, () => getNetwork(getUserKey())))
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
      userPetnames
        .get()
        .filter(t => t[1] !== pubkey)
        .concat([["p", pubkey, url, name || ""]])
    )

  const unfollow = pubkey => updatePetnames(reject(t => t[1] === pubkey, userPetnames.get()))

  return {
    graph,
    getPetnames,
    getPetnamePubkeys,
    getFollows,
    getNetwork,
    isFollowing,
    userPetnames,
    userPetnamePubkeys,
    userFollows,
    userNetwork,
    isUserFollowing,
    follow,
    unfollow,
    sortByGraph,
  }
}
