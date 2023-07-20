import {ensurePlural} from "hurdak"
import {now} from "src/util/misc"
import {Tags} from "src/util/nostr"
import type {GraphEntry} from "src/engine/types"
import {collection} from "../util/store"

export class Nip02 {
  static contributeState() {
    const graph = collection<GraphEntry>("pubkey")

    return {graph}
  }

  static contributeActions({Nip02}) {
    const getPetnames = pubkey => Nip02.graph.key(pubkey).get()?.petnames || []

    const getMutedTags = pubkey => Nip02.graph.key(pubkey).get()?.mutes || []

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

    return {
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
    }
  }

  static initialize({Events, Nip02}) {
    Events.addHandler(3, e => {
      const entry = Nip02.graph.key(e.pubkey).get()

      if (e.created_at < entry?.petnames_updated_at) {
        return
      }

      Nip02.graph.key(e.pubkey).merge({
        updated_at: now(),
        petnames_updated_at: e.created_at,
        petnames: Tags.from(e).type("p").all(),
      })
    })

    Events.addHandler(10000, e => {
      const entry = Nip02.graph.key(e.pubkey).get()

      if (e.created_at < entry?.mutes_updated_at) {
        return
      }

      Nip02.graph.key(e.pubkey).merge({
        updated_at: now(),
        mutes_updated_at: e.created_at,
        mutes: Tags.from(e).type(["e", "p"]).all(),
      })
    })
  }
}
