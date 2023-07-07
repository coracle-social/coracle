import {sortBy, pluck, uniq, nth, uniqBy, reject, whereEq, when, prop, last, inc} from "ramda"
import {first} from "hurdak/lib/hurdak"
import {get} from "svelte/store"
import {fuzzy, chain, tryJson, now, fetchJson} from "src/util/misc"
import {warn} from "src/util/logger"
import {normalizeRelayUrl, findReplyId, isShareableRelay, Tags} from "src/util/nostr"
import {DUFFLEPUD_URL, DEFAULT_RELAYS, SEARCH_RELAYS, FORCE_RELAYS} from "src/system/env"
import {Table, watch} from "src/agent/db"

export default ({keys, sync, getCmd, sortByGraph}) => {
  const relays = new Table("routing/relays", "url", {sort: sortBy(e => -e.count)})
  const policies = new Table("routing/policies", "pubkey", {sort: sortByGraph})

  // Data sync

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

  // Utils

  const getRelay = url => relays.get(url) || {url}

  const getRelayMeta = url => relays.get(url)?.meta || {}

  const searchRelays = watch(relays, () => fuzzy(relays.all(), {keys: ["url"]}))

  const displayRelay = ({url}) => last(url.split("://"))

  const getPubkeyRelays = (pubkey, mode = null) => {
    const relays = policies.get(pubkey)?.relays || []

    return mode ? relays.filter(prop(mode)) : relays
  }

  const getPubkeyRelayUrls = (pubkey, mode = null) =>
    pluck("url", getPubkeyRelays(pubkey, (mode = null)))

  const getUserKey = () => keys.getPubkey() || "anonymous"

  const getUserRelays = (...args) => getPubkeyRelays(getUserKey(), ...args)

  const getUserRelayUrls = (...args) => pluck("url", getUserRelays(...args))

  const getSearchRelays = () =>
    SEARCH_RELAYS.concat(pluck("url", relays.all({"meta.supported_nips": {$contains: 50}}))).slice(
      0,
      8
    )

  // Smart relay selection
  //
  // From Mike Dilger:
  // 1) Other people's write relays — pull events from people you follow,
  //    including their contact lists
  // 2) Other people's read relays — push events that tag them (replies or just tagging).
  //    However, these may be authenticated, use with caution
  // 3) Your write relays —- write events you post to your microblog feed for the
  //    world to see.  ALSO write your contact list.  ALSO read back your own contact list.
  // 4) Your read relays —- read events that tag you.  ALSO both write and read
  //    client-private data like client configuration events or anything that the world
  //    doesn't need to see.
  // 5) Advertise relays — write and read back your own relay list

  const selectHints = (limit, hints) => {
    const result = new Set() as Set<string>

    for (const hint of chain(hints, getUserRelayUrls(), DEFAULT_RELAYS)) {
      result.add(hint)

      if (result.size > limit) {
        break
      }
    }

    return Array.from(result)
  }

  const hintSelector =
    generateHints =>
    (limit, ...args) =>
      selectHints(limit, generateHints(...args))

  const getPubkeyHints = hintSelector(function* (pubkey, mode = "write") {
    const other = mode === "write" ? "read" : "write"

    yield* pluck("url", getPubkeyRelays(pubkey, mode))
    yield* pluck("url", getPubkeyRelays(pubkey, other))
  })

  const getPubkeyHint = (...args) => first(getPubkeyHints(1, ...args))

  const getUserHints = (limit, ...args) => getPubkeyHints(limit, getUserKey(), ...args)

  const getUserHint = () => first(getUserHints(1, getUserKey()))

  const getEventHints = hintSelector(function* (event) {
    yield* event.seen_on
    yield* getPubkeyHints(null, event.pubkey)
  })

  const getEventHint = event => first(getEventHints(1, event))

  // If we're looking for an event's children, the read relays the author has
  // advertised would be the most reliable option, since well-behaved clients
  // will write replies there. However, this may include spam, so we may want
  // to read from the current user's network's read relays instead.
  const getReplyHints = hintSelector(function* (event) {
    yield* pluck("url", getPubkeyRelays(event.pubkey, "write"))
    yield* event.seen_on
    yield* pluck("url", getPubkeyRelays(event.pubkey, "read"))
  })

  // If we're looking for an event's parent, tags are the most reliable hint,
  // but we can also look at where the author of the note reads from
  const getParentHints = hintSelector(function* (event) {
    const parentId = findReplyId(event)

    yield* Tags.from(event).equals(parentId).relays()
    yield* event.seen_on
    yield* getPubkeyHints(null, event.pubkey, "read")
  })

  // If we're replying or reacting to an event, we want the author to know, as well as
  // anyone else who is tagged in the original event or the reply. Get everyone's read
  // relays. Limit how many per pubkey we publish to though. We also want to advertise
  // our content to our followers, so publish to our write relays as well.
  const getPublishHints = (limit, event) => {
    const tags = Tags.from(event)
    const pubkeys = tags.type("p").values().all().concat(event.pubkey)
    const hints = mergeHints(
      limit,
      pubkeys.map(pubkey => getPubkeyHints(3, pubkey, "read"))
    )

    return uniq(hints.concat(getPubkeyRelays(getUserKey(), "write")))
  }

  const mergeHints = (limit, groups) => {
    const scores = {} as Record<string, any>

    for (const hints of groups) {
      hints.forEach((hint, i) => {
        const score = 1 / (i + 1) / hints.length

        if (!scores[hint]) {
          scores[hint] = {score: 0, count: 0}
        }

        scores[hint].score += score
        scores[hint].count += 1
      })
    }

    // Use the log-sum-exp and a weighted sum
    for (const score of Object.values(scores)) {
      const weight = Math.log(groups.length / score.count)

      score.score = weight + Math.log1p(Math.exp(score.score - score.count))
    }

    return sortBy(([hint, {score}]) => -score, Object.entries(scores))
      .map(nth(0))
      .slice(0, limit)
  }

  // CRUD

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

  // Initialization

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
    getPubkeyRelayUrls,
    getUserKey,
    getUserRelays,
    getUserRelayUrls,
    getSearchRelays,
    selectHints,
    getPubkeyHints,
    getPubkeyHint,
    getUserHints,
    getUserHint,
    getEventHints,
    getEventHint,
    getReplyHints,
    getParentHints,
    getPublishHints,
    mergeHints,
    setUserRelays,
    addUserRelay,
    removeUserRelay,
    setUserRelayPolicy,
    initialize,
  }
}
