import {without, pluck, uniq} from "ramda"
import {chunk, seconds, ensurePlural} from "hurdak"
import {personKinds, appDataKeys} from "src/util/nostr"
import {now} from "src/util/misc"
import type {Filter} from "src/engine2/model"
import {profiles, settings} from "src/engine2/state"
import {mergeHints, getPubkeyHints} from "src/engine2/queries"
import {Subscription} from "./subscription"

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

    if (profiles.key(pubkey).get()?.updated_at || 0 > since) {
      continue
    }

    stale.add(pubkey)
  }

  return Array.from(stale)
}

export const loadPubkeys = async (
  pubkeyGroups: string | string[],
  {relays, force, kinds = personKinds}: LoadPeopleOpts = {}
) => {
  const rawPubkeys = ensurePlural(pubkeyGroups).reduce((a, b) => a.concat(b), [])
  const pubkeys = force ? uniq(rawPubkeys) : getStalePubkeys(rawPubkeys)

  const getChunkRelays = (chunk: string[]) => {
    if (relays?.length > 0) {
      return relays
    }

    const {relay_limit: limit} = settings.get()

    return mergeHints(
      limit,
      chunk.map(pubkey => getPubkeyHints(limit, pubkey, "write"))
    )
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
    pluck(
      "result",
      chunk(256, pubkeys).map(
        (chunk: string[]) =>
          new Subscription({
            relays: getChunkRelays(chunk),
            filters: getChunkFilters(chunk),
            timeout: 10_000,
          })
      )
    )
  )
}
