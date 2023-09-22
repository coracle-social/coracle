import {without, uniq} from "ramda"
import {chunk, seconds} from "hurdak"
import {now} from "src/util/misc"
import {personKinds, appDataKeys} from "src/util/nostr"
import {people} from "src/engine/people/state"
import {mergeHints, getPubkeyHints} from "src/engine/relays/utils"
import type {Filter} from "../model"
import {load} from "./load"

export type LoadPeopleOpts = {
  relays?: string[]
  kinds?: number[]
  force?: boolean
}

export const attemptedPubkeys = new Set()

export const getStalePubkeys = (pubkeys: string[]) => {
  const stale = new Set()
  const since = now() - seconds(3, "hour")

  for (const pubkey of pubkeys) {
    if (stale.has(pubkey) || attemptedPubkeys.has(pubkey)) {
      continue
    }

    attemptedPubkeys.add(pubkey)

    const key = people.key(pubkey)

    if ((key.get()?.last_fetched || 0) > since) {
      continue
    }

    key.merge({last_fetched: now()})

    stale.add(pubkey)
  }

  return Array.from(stale)
}

export const loadPubkeys = async (
  rawPubkeys: string[],
  {relays, force, kinds = personKinds}: LoadPeopleOpts = {}
) => {
  const pubkeys = force ? uniq(rawPubkeys) : getStalePubkeys(rawPubkeys)

  const getChunkRelays = (chunk: string[]) => {
    if (relays?.length > 0) {
      return relays
    }

    return mergeHints(chunk.map(pubkey => getPubkeyHints(pubkey, "write")))
  }

  const getChunkFilters = (chunk: string[]) => {
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
    chunk(256, pubkeys).map((chunk: string[]) =>
      load({
        relays: getChunkRelays(chunk),
        filters: getChunkFilters(chunk),
      })
    )
  )
}
