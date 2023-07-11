import {without, uniq} from "ramda"
import {chunk} from "hurdak/lib/hurdak"
import {personKinds, appDataKeys} from "src/util/nostr"
import {now, timedelta} from "src/util/misc"
import type {Filter} from "src/system/types"
import type {System} from "src/system/system"

export type LoadPeopleOpts = {
  relays?: string[]
  kinds?: number[]
  force?: boolean
}

export class PubkeyLoader {
  system: System
  attemptedPubkeys: Set<string>

  constructor(system) {
    this.system = system
    this.attemptedPubkeys = new Set()
  }

  getStalePubkeys = pubkeys => {
    const stale = new Set()
    const since = now() - timedelta(3, "hours")

    for (const pubkey of pubkeys) {
      if (stale.has(pubkey) || this.attemptedPubkeys.has(pubkey)) {
        continue
      }

      this.attemptedPubkeys.add(pubkey)

      const profile = this.system.directory.profiles.get(pubkey)

      if (profile?.updated_at > since) {
        continue
      }

      stale.add(pubkey)
    }

    return stale
  }

  loadPubkeys = async (rawPubkeys, {relays, force, kinds = personKinds}: LoadPeopleOpts = {}) => {
    const {network, routing, user} = this.system
    const pubkeys = force ? uniq(rawPubkeys) : this.getStalePubkeys(rawPubkeys)

    const getChunkRelays = chunk => {
      if (relays?.length > 0) {
        return relays
      }

      return routing.mergeHints(
        user.getSetting("relay_limit"),
        chunk.map(pubkey => routing.getPubkeyHints(3, pubkey))
      )
    }

    const getChunkFilter = chunk => {
      const filter = [] as Filter[]

      filter.push({kinds: without([30078], kinds), authors: chunk})

      // Add a separate filter for app data so we're not pulling down other people's stuff,
      // or obsolete events of our own.
      if (kinds.includes(30078)) {
        filter.push({kinds: [30078], authors: chunk, "#d": appDataKeys})
      }

      return filter
    }

    await Promise.all(
      chunk(256, pubkeys).map(async chunk => {
        await network.load({
          relays: getChunkRelays(chunk),
          filter: getChunkFilter(chunk),
        })
      })
    )
  }
}
