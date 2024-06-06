import {seconds} from "hurdak"
import {batch, addToMapKey, now, inc} from "@welshman/lib"
import {
  RELAYS,
  PROFILE,
  HANDLER_INFORMATION,
  NAMED_BOOKMARKS,
  FEED,
  FOLLOWS,
  APP_DATA,
} from "@welshman/util"
import {isHex, appDataKeys} from "src/util/nostr"
import {LIST_KINDS} from "src/domain"
import {getFreshness, setFreshness, withIndexers, load, hints} from "src/engine/state"

const attempts = new Map<string, number>()

const getStalePubkeys = (pubkeys: string[], key: string, delta: number) => {
  const seen = new Set<string>()
  const result = new Set<string>()

  for (const pubkey of pubkeys) {
    if (!isHex(pubkey) || seen.has(pubkey)) {
      continue
    }

    seen.add(pubkey)

    // If we've tried a few times, slow down the duplicate requests
    const thisAttempts = inc(attempts.get(pubkey))
    const thisDelta = delta * thisAttempts

    if (getFreshness(key, pubkey) < now() - thisDelta) {
      setFreshness(key, pubkey, now())
      attempts.set(pubkey, thisAttempts)
      result.add(pubkey)
    }
  }

  return Array.from(result)
}

const getFiltersForKey = (key: string, authors: string[]) => {
  switch (key) {
    case "pubkey/lists":
      return [{authors, kinds: LIST_KINDS}]
    case "pubkey/feeds":
      return [{authors, kinds: [NAMED_BOOKMARKS, FEED]}]
    case "pubkey/relays":
      return [{authors, kinds: [RELAYS]}]
    case "pubkey/profile":
      return [{authors, kinds: [PROFILE, FOLLOWS, HANDLER_INFORMATION]}]
    case "pubkey/user":
      return [
        {authors, kinds: [PROFILE, RELAYS, FOLLOWS, APP_DATA]},
        {authors, kinds: [APP_DATA], "#d": Object.values(appDataKeys)},
      ]
  }
}

const loadPubkeysThrottled = batch(
  300,
  async (requests: {key: string; pubkeys: string[]; resolve: () => void}[]) => {
    const pubkeysByKey = new Map<string, Set<string>>()

    for (const {key, pubkeys} of requests) {
      for (const pubkey of pubkeys) {
        addToMapKey(pubkeysByKey, key, pubkey)
      }
    }

    await Promise.all([
      Array.from(pubkeysByKey.entries()).map(([key, pubkeys]) => {
        const authors = Array.from(pubkeys)

        return load({
          skipCache: true,
          filters: getFiltersForKey(key, authors),
          relays: withIndexers(hints.FromPubkeys(authors).getUrls()),
        })
      }),
    ])

    for (const {resolve} of requests) {
      resolve()
    }
  },
)

type LoadPubkeyOpts = {
  force?: boolean
  relays?: string[]
}

const loadPubkeyData = (
  key: string,
  rawPubkeys: string[],
  {force = false, relays = []}: LoadPubkeyOpts = {},
) => {
  const delta = force ? 5 : seconds(15, "minute")
  const pubkeys = getStalePubkeys(rawPubkeys, key, delta)

  return new Promise<void>(resolve => {
    if (pubkeys.length > 0) {
      loadPubkeysThrottled({key, pubkeys, resolve})
    } else {
      resolve()
    }
  })
}

export const loadPubkeyLists = (pubkeys: string[], opts: LoadPubkeyOpts = {}) =>
  loadPubkeyData("pubkey/lists", pubkeys, opts)

export const loadPubkeyFeeds = (pubkeys: string[], opts: LoadPubkeyOpts = {}) =>
  loadPubkeyData("pubkey/feeds", pubkeys, opts)

export const loadPubkeyRelays = (pubkeys: string[], opts: LoadPubkeyOpts = {}) =>
  loadPubkeyData("pubkey/relays", pubkeys, opts)

export const loadPubkeyProfiles = (pubkeys: string[], opts: LoadPubkeyOpts = {}) =>
  loadPubkeyData("pubkey/profile", pubkeys, opts)

export const loadPubkeyUserData = (pubkeys: string[], opts: LoadPubkeyOpts = {}) =>
  loadPubkeyData("pubkey/user", pubkeys, {force: true, ...opts})

export const loadPubkeys = async (pubkeys: string[], opts: LoadPubkeyOpts = {}) =>
  // Load relays, then load profiles so we have a better chance of finding them. But also
  // load profiles concurrently so that if we do find them it takes as little time as possible.
  // Requests will be deduplicated by tracking freshness and within welshman
  Promise.all([
    loadPubkeyRelays(pubkeys, opts).then(() => loadPubkeyProfiles(pubkeys, opts)),
    loadPubkeyProfiles(pubkeys, opts),
  ])
