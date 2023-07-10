import {ensurePlural} from "hurdak/lib/hurdak"
import {now} from "src/util/misc"
import {Tags} from "src/util/nostr"
import {Table} from "src/util/loki"
import type {System} from "src/system/system"
import type {GraphEntry} from "src/system/types"

export class Social {
  system: System
  graph: Table<GraphEntry>
  constructor(system) {
    this.system = system

    this.graph = new Table(this.system.key("social/graph"), "pubkey", {
      max: 5000,
      sort: this.system.sortByGraph,
    })

    this.system.sync.addHandler(3, e => {
      const entry = this.graph.get(e.pubkey)

      if (e.created_at < entry?.petnames_updated_at) {
        return
      }

      this.graph.patch({
        pubkey: e.pubkey,
        updated_at: now(),
        petnames_updated_at: e.created_at,
        petnames: Tags.from(e).type("p").all(),
      })
    })

    this.system.sync.addHandler(10000, e => {
      const entry = this.graph.get(e.pubkey)

      if (e.created_at < entry?.mutes_updated_at) {
        return
      }

      this.graph.patch({
        pubkey: e.pubkey,
        updated_at: now(),
        mutes_updated_at: e.created_at,
        mutes: Tags.from(e).type("p").all(),
      })
    })
  }

  getPetnames = pubkey => this.graph.get(pubkey)?.petnames || []

  getMutedTags = pubkey => this.graph.get(pubkey)?.mutes || []

  getFollowsSet = pubkeys => {
    const follows = new Set()

    for (const pubkey of ensurePlural(pubkeys)) {
      for (const tag of this.getPetnames(pubkey)) {
        follows.add(tag[1])
      }
    }

    return follows
  }

  getMutesSet = pubkeys => {
    const mutes = new Set()

    for (const pubkey of ensurePlural(pubkeys)) {
      for (const tag of this.getMutedTags(pubkey)) {
        mutes.add(tag[1])
      }
    }

    return mutes
  }

  getFollows = pubkeys => Array.from(this.getFollowsSet(pubkeys))

  getMutes = pubkeys => Array.from(this.getMutesSet(pubkeys))

  getNetworkSet = (pubkeys, includeFollows = false) => {
    const follows = this.getFollowsSet(pubkeys)
    const network = includeFollows ? follows : new Set()

    for (const pubkey of this.getFollows(follows)) {
      if (!follows.has(pubkey)) {
        network.add(pubkey)
      }
    }

    return network
  }

  getNetwork = pubkeys => Array.from(this.getNetworkSet(pubkeys))

  isFollowing = (a, b) => this.getFollowsSet(a).has(b)

  isIgnoring = (a, b) => this.getMutesSet(a).has(b)
}
