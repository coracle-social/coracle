import {without, pluck, uniq} from "ramda"
import {chunk, seconds, ensurePlural} from "hurdak"
import {personKinds, appDataKeys} from "src/util/nostr"
import {now} from "src/util/misc"
import type {Filter} from "src/engine/types"
import type {Engine} from "src/engine/Engine"

export type LoadPeopleOpts = {
  relays?: string[]
  kinds?: number[]
  force?: boolean
}

export class PubkeyLoader {
  engine: Engine
  attemptedPubkeys = new Set()

  constructor(engine: Engine) {
    this.engine = engine
  }

  getStalePubkeys = (pubkeys: string[]) => {
    const stale = new Set()
    const since = now() - seconds(3, "hour")

    for (const pubkey of pubkeys) {
      if (stale.has(pubkey) || this.attemptedPubkeys.has(pubkey)) {
        continue
      }

      this.attemptedPubkeys.add(pubkey)

      if (this.engine.Directory.profiles.key(pubkey).get()?.updated_at || 0 > since) {
        continue
      }

      stale.add(pubkey)
    }

    return Array.from(stale)
  }

  load = async (
    pubkeyGroups: string | string[],
    {relays, force, kinds = personKinds}: LoadPeopleOpts = {}
  ) => {
    const rawPubkeys = ensurePlural(pubkeyGroups).reduce((a, b) => a.concat(b), [])
    const pubkeys = force ? uniq(rawPubkeys) : this.getStalePubkeys(rawPubkeys)

    const getChunkRelays = (chunk: string[]) => {
      if (relays?.length > 0) {
        return relays
      }

      const limit = this.engine.Settings.getSetting("relay_limit")

      return this.engine.Nip65.mergeHints(
        limit,
        chunk.map(pubkey => this.engine.Nip65.getPubkeyHints(limit, pubkey, "write"))
      )
    }

    const getChunkFilter = (chunk: string[]) => {
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
        "result",
        chunk(256, pubkeys).map((chunk: string[]) =>
          this.engine.Network.subscribe({
            relays: getChunkRelays(chunk),
            filter: getChunkFilter(chunk),
            timeout: 10_000,
          })
        )
      )
    )
  }
}
