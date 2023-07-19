import {without, pluck, uniq} from "ramda"
import {chunk, seconds, ensurePlural} from "hurdak"
import {personKinds, appDataKeys} from "src/util/nostr"
import {now} from "src/util/misc"
import type {Filter} from "src/engine/types"

export type LoadPeopleOpts = {
  relays?: string[]
  kinds?: number[]
  force?: boolean
}

export class PubkeyLoader {
  static contributeActions({Directory, Nip65, User, Network}) {
    const attemptedPubkeys = new Set()

    const getStalePubkeys = pubkeys => {
      const stale = new Set()
      const since = now() - seconds(3, "hour")

      for (const pubkey of pubkeys) {
        if (stale.has(pubkey) || attemptedPubkeys.has(pubkey)) {
          continue
        }

        attemptedPubkeys.add(pubkey)

        if (Directory.profiles.key(pubkey).get()?.updated_at || 0 > since) {
          continue
        }

        stale.add(pubkey)
      }

      return stale
    }

    const load = async (
      pubkeyGroups,
      {relays, force, kinds = personKinds}: LoadPeopleOpts = {}
    ) => {
      const rawPubkeys = ensurePlural(pubkeyGroups).reduce((a, b) => a.concat(b), [])
      const pubkeys = force ? uniq(rawPubkeys) : getStalePubkeys(rawPubkeys)

      const getChunkRelays = chunk => {
        if (relays?.length > 0) {
          return relays
        }

        return Nip65.mergeHints(
          User.getSetting("relay_limit"),
          chunk.map(pubkey => Nip65.getPubkeyHints(3, pubkey))
        )
      }

      const getChunkFilter = chunk => {
        const filter = [] as Filter[]

        filter.push({kinds: without([30078], kinds), authors: chunk})

        // Add a separate filter for app data so we're not pulling down other people's stuff,
        // or obsolete events of our own.
        if (kinds.includes(30078)) {
          filter.push({kinds: [30078], authors: chunk, "#d": Object.values(appDataKeys)})
        }

        return filter
      }

      await Promise.all(
        pluck(
          "complete",
          chunk(256, pubkeys).map(chunk =>
            Network.subscribe({
              relays: getChunkRelays(chunk),
              filter: getChunkFilter(chunk),
              timeout: 10_000,
            })
          )
        )
      )
    }

    return {load}
  }
}
