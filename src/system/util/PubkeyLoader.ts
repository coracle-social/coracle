import {without, uniq} from "ramda"
import {chunk} from "hurdak/lib/hurdak"
import {personKinds, appDataKeys} from "src/util/nostr"
import {now, timedelta} from "src/util/misc"
import type {Filter} from "src/system/types"

export type PubkeyLoaderOpts = {
  getLastUpdated: (pubkey: string) => number
  getChunkRelays: (pubkeys: string[]) => string[]
  loadChunk: (args: {filter: Filter | Filter[]; relays: string[]}) => Promise<void>
}

export type LoadPeopleOpts = {
  relays?: string[]
  kinds?: number[]
  force?: boolean
}

export class PubkeyLoader {
  attemptedPubkeys: Set<string>
  getLastUpdated: PubkeyLoaderOpts["getLastUpdated"]
  getChunkRelays: PubkeyLoaderOpts["getChunkRelays"]
  loadChunk: PubkeyLoaderOpts["loadChunk"]

  constructor({getLastUpdated, getChunkRelays, loadChunk}: PubkeyLoaderOpts) {
    this.attemptedPubkeys = new Set()
    this.getLastUpdated = getLastUpdated
    this.getChunkRelays = getChunkRelays
    this.loadChunk = loadChunk
  }

  getStalePubkeys = pubkeys => {
    const stale = new Set()
    const since = now() - timedelta(3, "hours")

    for (const pubkey of pubkeys) {
      if (stale.has(pubkey) || this.attemptedPubkeys.has(pubkey)) {
        continue
      }

      this.attemptedPubkeys.add(pubkey)

      if (this.getLastUpdated(pubkey) > since) {
        continue
      }

      stale.add(pubkey)
    }

    return stale
  }

  loadPubkeys = async (rawPubkeys, {relays, force, kinds = personKinds}: LoadPeopleOpts = {}) => {
    const pubkeys = force ? uniq(rawPubkeys) : this.getStalePubkeys(rawPubkeys)

    const getChunkRelays = chunk => {
      if (relays?.length > 0) {
        return relays
      }

      return this.getChunkRelays(chunk)
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
        await this.loadChunk({
          relays: getChunkRelays(chunk),
          filter: getChunkFilter(chunk),
        })
      })
    )
  }
}
