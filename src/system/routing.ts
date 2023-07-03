import {sortBy, uniqBy, reject, whereEq, when, prop, last, inc} from "ramda"
import {get} from "svelte/store"
import {fuzzy, tryJson, now, fetchJson} from "src/util/misc"
import {warn} from "src/util/logger"
import {normalizeRelayUrl, isShareableRelay, Tags} from "src/util/nostr"
import {DUFFLEPUD_URL, DEFAULT_RELAYS, FORCE_RELAYS} from "src/system/env"
import {Table, watch} from "src/agent/db"

export default ({keys, sync, getCmd, sortByGraph}) => {
  const relays = new Table("routing/relays", "url", {sort: sortBy(e => -e.count)})
  const policies = new Table("routing/policies", "pubkey", {sort: sortByGraph})

  const addRelay = url => {
    const relay = relays.get(url)

    relays.patch({
      url,
      count: inc(relay?.count || 0),
      first_seen: relay?.first_seen || now(),
      meta: {
        last_checked: 0,
      },
    })
  }

  const setPolicy = ({pubkey, created_at}, relays) => {
    if (relays?.length > 0) {
      if (created_at < policies.get(pubkey)?.created_at) {
        return
      }

      policies.patch({
        pubkey,
        created_at,
        relays: uniqBy(prop("url"), relays).map(relay => {
          addRelay(relay.url)

          return {read: true, write: true, ...relay}
        }),
      })
    }
  }

  sync.addHandler(2, e => {
    if (isShareableRelay(e.content)) {
      addRelay(normalizeRelayUrl(e.content))
    }
  })

  sync.addHandler(3, e => {
    setPolicy(
      e,
      tryJson(() => {
        Object.entries(JSON.parse(e.content || ""))
          .filter(([url]) => isShareableRelay(url))
          .map(([url, conditions]) => {
            // @ts-ignore
            const write = ![false, "!"].includes(conditions.write)
            // @ts-ignore
            const read = ![false, "!"].includes(conditions.read)

            return {url: normalizeRelayUrl(url), write, read}
          })
      })
    )
  })

  sync.addHandler(10002, e => {
    setPolicy(
      e,
      Tags.from(e)
        .type("r")
        .all()
        .map(([_, url, mode]) => {
          const write = !mode || mode === "write"
          const read = !mode || mode === "read"

          if (!write && !read) {
            warn(`Encountered unknown relay mode: ${mode}`)
          }

          return {url: normalizeRelayUrl(url), write, read}
        })
    )
  })

  const getRelay = url => relays.get(url) || {url}

  const getRelayMeta = url => relays.get(url)?.meta || {}

  const searchRelays = watch(relays, () => fuzzy(relays.all(), {keys: ["url"]}))

  const displayRelay = ({url}) => last(url.split("://"))

  const getPubkeyRelays = (pubkey, mode = null) => {
    const relays = policies.get(pubkey)?.relays || []

    return mode ? relays.filter(prop(mode)) : relays
  }

  const getUserKey = () => keys.getPubkey() || "anonymous"

  const getUserRelays = (...args) => getPubkeyRelays(getUserKey(), ...args)

  const setUserRelays = relays => {
    if (get(keys.canSign)) {
      return getCmd().setRelays(relays).publish(relays)
    } else {
      setPolicy({pubkey: getUserKey(), created_at: now()}, relays)
    }
  }

  const addUserRelay = url => setUserRelays(getUserRelays().concat({url}))

  const removeUserRelay = url =>
    setUserRelays(reject(whereEq({url: normalizeRelayUrl(url)}), getUserRelays()))

  const setUserRelayPolicy = (url, policy) =>
    setUserRelays(getUserRelays().map(when(whereEq({url}), p => ({...p, ...policy}))))

  const initialize = async () => {
    // Throw some hardcoded defaults in there
    DEFAULT_RELAYS.forEach(addRelay)

    // Load relays from nostr.watch via dufflepud
    if (FORCE_RELAYS.length === 0) {
      try {
        const json = await fetchJson(DUFFLEPUD_URL + "/relay")

        json.relays.filter(isShareableRelay).forEach(addRelay)
      } catch (e) {
        warn("Failed to fetch relays list", e)
      }
    }
  }

  return {
    relays,
    policies,
    getRelay,
    getRelayMeta,
    searchRelays,
    displayRelay,
    getPubkeyRelays,
    getUserKey,
    getUserRelays,
    setUserRelays,
    addUserRelay,
    removeUserRelay,
    setUserRelayPolicy,
    initialize,
  }
}
