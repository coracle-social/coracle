import {without, uniq} from "ramda"
import {seconds} from "hurdak"
import {now} from "paravel"
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

export const attemptedPubkeys = new Map()

export const getStalePubkeys = (pubkeys: string[]) => {
  const stale = new Set<string>()
  const since = now() - seconds(3, "hour")

  for (const pubkey of pubkeys) {
    if (!pubkey.match(/^[0-f]{64}$/)) {
      continue
    }

    const attempts = attemptedPubkeys.get(pubkey) | 0

    if (stale.has(pubkey) || attempts > 1) {
      continue
    }

    attemptedPubkeys.set(pubkey, attempts + 1)

    const person = people.key(pubkey).get()

    if (person?.profile && (person?.last_fetched || 0) > since) {
      continue
    }

    people.key(pubkey).merge({last_fetched: now()})

    stale.add(pubkey)
  }

  return Array.from(stale)
}

export const loadPubkeys = async (
  rawPubkeys: string[],
  {relays, force, kinds = personKinds}: LoadPeopleOpts = {},
) => {
  const pubkeys = force ? uniq(rawPubkeys) : getStalePubkeys(rawPubkeys)

  if (pubkeys.length === 0) {
    return
  }

  const getRelays = () => {
    const groups = pubkeys.map(pubkey => getPubkeyHints(pubkey, "write"))

    if (relays) {
      groups.push(relays)
    }

    return mergeHints(groups)
  }

  const getFilters = () => {
    const filter = [] as Filter[]

    filter.push({kinds: without([30078], kinds), authors: pubkeys})

    // Add a separate filter for app data so we're not pulling down other people's stuff,
    // or obsolete events of our own.
    if (kinds.includes(30078)) {
      filter.push({kinds: [30078], authors: pubkeys, "#d": Object.values(appDataKeys)})
    }

    return filter
  }

  return load({
    relays: getRelays(),
    filters: getFilters(),
  })
}
