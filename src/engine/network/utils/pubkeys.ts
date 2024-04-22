import {without, assoc} from "ramda"
import {seconds} from "hurdak"
import {now, inc} from "@welshman/lib"
import type {Filter} from "@welshman/util"
import {personKinds, appDataKeys} from "src/util/nostr"
import {people} from "src/engine/people/state"
import {hints} from "src/engine/relays/utils"
import {load} from "./executor"

const attempts = new Map<string, number>()

export const getValidPubkeys = (pubkeys: string[], key: string, force = false) => {
  const result = new Set<string>()

  for (const pubkey of pubkeys) {
    if (!pubkey?.match(/^[0-f]{64}$/)) {
      continue
    }

    const person = people.key(pubkey)
    const $person = person.get()
    const tskey = `${key}_fetched_at`
    const ts = $person?.[tskey]

    if (!force) {
      // Avoid multiple concurrent requests
      if (ts > now() - 5) {
        continue
      }

      // If we've tried a few times, slow down with duplicate requests
      if (attempts.get(pubkey) > 3 && ts > now() - seconds(5, "minute")) {
        continue
      }

      // If we have something to show the user, and we checked recently, leave it alone
      if ($person?.[key] && ts > now() - seconds(1, "hour")) {
        continue
      }
    }

    attempts.set(pubkey, inc(attempts.get(pubkey)))
    person.merge({[tskey]: now()})
    result.add(pubkey)
  }

  return Array.from(result)
}

export type LoadPubkeyOpts = {
  force?: boolean
  kinds?: number[]
  relays?: string[]
}

export const loadPubkeyProfiles = (rawPubkeys: string[], opts: LoadPubkeyOpts = {}) => {
  const promises = []
  const filters = [] as Filter[]
  const kinds = without([10002], opts.kinds || personKinds)
  const pubkeys = getValidPubkeys(rawPubkeys, "profile", opts.force)

  if (pubkeys.length === 0) {
    return
  }

  filters.push({kinds: without([30078], kinds)})

  // Add a separate filters for app data so we're not pulling down other people's stuff,
  // or obsolete events of our own.
  if (kinds.includes(30078)) {
    filters.push({kinds: [30078], "#d": Object.values(appDataKeys)})
  }

  promises.push(
    load({
      skipCache: true,
      relays: hints.Indexers(opts.relays || []).getUrls(),
      filters: filters.map(assoc("authors", pubkeys)),
    }),
  )

  for (const {relay, values} of hints.FromPubkeys(pubkeys).getSelections()) {
    promises.push(
      load({
        skipCache: true,
        relays: [relay],
        filters: filters.map(assoc("authors", values)),
      }),
    )
  }

  return Promise.all(promises)
}

export const loadPubkeyRelays = (rawPubkeys: string[], opts: LoadPubkeyOpts = {}) => {
  const promises = []
  const pubkeys = getValidPubkeys(rawPubkeys, "relays", opts.force)

  if (pubkeys.length === 0) {
    return
  }

  promises.push(
    load({
      skipCache: true,
      filters: [{kinds: [10002], authors: pubkeys}],
      relays: hints.Indexers(opts.relays || []).getUrls(),
      onEvent: e => loadPubkeyProfiles([e.pubkey]),
    }),
  )

  for (const {relay, values} of hints.FromPubkeys(pubkeys).getSelections()) {
    promises.push(
      load({
        skipCache: true,
        relays: [relay],
        filters: [{kinds: [10002], authors: values}],
        onEvent: e => loadPubkeyProfiles([e.pubkey]),
      }),
    )
  }

  return Promise.all(promises)
}

export const loadPubkeys = async (pubkeys: string[], opts: LoadPubkeyOpts = {}) =>
  Promise.all([loadPubkeyRelays(pubkeys, opts), loadPubkeyProfiles(pubkeys, opts)])
