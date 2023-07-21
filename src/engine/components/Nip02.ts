import {ensurePlural} from "hurdak"
import {now} from "src/util/misc"
import {Tags} from "src/util/nostr"
import type {GraphEntry} from "src/engine/types"
import type {Engine} from "src/engine/Engine"
import {collection} from "src/engine/util/store"

export class Nip02 {
  graph = collection<GraphEntry>("pubkey")

  getPetnames = (pubkey: string) => this.graph.key(pubkey).get()?.petnames || []

  getMutedTags = (pubkey: string) => this.graph.key(pubkey).get()?.mutes || []

  getFollowsSet = (pubkeys: string | string[]) => {
    const follows = new Set<string>()

    for (const pubkey of ensurePlural(pubkeys)) {
      for (const tag of this.getPetnames(pubkey)) {
        follows.add(tag[1])
      }
    }

    return follows
  }

  getMutesSet = (pubkeys: string | string[]) => {
    const mutes = new Set<string>()

    for (const pubkey of ensurePlural(pubkeys)) {
      for (const tag of this.getMutedTags(pubkey)) {
        mutes.add(tag[1])
      }
    }

    return mutes
  }

  getFollows = (pubkeys: string | string[]) => Array.from(this.getFollowsSet(pubkeys))

  getMutes = (pubkeys: string | string[]) => Array.from(this.getMutesSet(pubkeys))

  getNetworkSet = (pubkeys: string | string[], includeFollows = false) => {
    const follows = this.getFollowsSet(pubkeys)
    const network = includeFollows ? follows : new Set<string>()

    for (const pubkey of this.getFollows(Array.from(follows))) {
      if (!follows.has(pubkey)) {
        network.add(pubkey)
      }
    }

    return network
  }

  getNetwork = (pubkeys: string | string[]) => Array.from(this.getNetworkSet(pubkeys))

  isFollowing = (a: string, b: string) => this.getFollowsSet(a).has(b)

  isIgnoring = (a: string, b: string) => this.getMutesSet(a).has(b)

  initialize(engine: Engine) {
    engine.components.Events.addHandler(3, e => {
      const entry = this.graph.key(e.pubkey).get()

      if (e.created_at < entry?.petnames_updated_at) {
        return
      }

      this.graph.key(e.pubkey).merge({
        updated_at: now(),
        petnames_updated_at: e.created_at,
        petnames: Tags.from(e).type("p").all(),
      })
    })

    engine.components.Events.addHandler(10000, e => {
      const entry = this.graph.key(e.pubkey).get()

      if (e.created_at < entry?.mutes_updated_at) {
        return
      }

      this.graph.key(e.pubkey).merge({
        updated_at: now(),
        mutes_updated_at: e.created_at,
        mutes: Tags.from(e).type(["e", "p"]).all(),
      })
    })
  }
}
