import {sortBy, pluck, uniq, nth, uniqBy, prop, last, inc} from "ramda"
import {first, chain, Fetch} from "hurdak"
import {fuzzy, tryJson, now} from "src/util/misc"
import {warn} from "src/util/logger"
import {normalizeRelayUrl, findReplyId, isShareableRelay, Tags} from "src/util/nostr"
import type {Relay, RelayInfo, RelayPolicy} from "src/engine/types"
import {derived, collection} from "../util/store"

export class Nip65 {
  static contributeState() {
    const relays = collection<Relay>("url")
    const policies = collection<RelayPolicy>("pubkey")

    return {relays, policies}
  }

  static contributeActions({Env, Nip65, Network, Meta, User}) {
    const addRelay = url => {
      if (isShareableRelay(url)) {
        const relay = Nip65.relays.key(url).get()

        Nip65.relays.key(url).merge({
          count: inc(relay?.count || 0),
          first_seen: relay?.first_seen || now(),
          info: {
            last_checked: 0,
          },
        })
      }
    }

    const setPolicy = ({pubkey, created_at}, relays) => {
      if (relays?.length > 0) {
        if (created_at < Nip65.policies.key(pubkey).get()?.created_at) {
          return
        }

        Nip65.policies.key(pubkey).merge({
          created_at,
          updated_at: now(),
          relays: uniqBy(prop("url"), relays).map(relay => {
            addRelay(relay.url)

            return {read: true, write: true, ...relay}
          }),
        })
      }
    }

    const getRelay = (url: string): Relay => Nip65.relays.key(url).get() || {url}

    const getRelayInfo = (url: string): RelayInfo => getRelay(url)?.info || {}

    const displayRelay = ({url}) => last(url.split("://"))

    const searchRelays = derived(Nip65.relays, $relays => fuzzy($relays.values(), {keys: ["url"]}))

    const getSearchRelays = () => {
      const searchableRelayUrls = Nip65.relays
        .get()
        .filter(r => (r.info?.supported_nips || []).includes(50))
        .map(prop("url"))

      return uniq(Env.SEARCH_RELAYS.concat(searchableRelayUrls)).slice(0, 8)
    }

    const getPubkeyRelays = (pubkey, mode = null) => {
      const relays = Nip65.policies.key(pubkey).get()?.relays || []

      return mode ? relays.filter(prop(mode)) : relays
    }

    const getPubkeyRelayUrls = (pubkey, mode = null) => pluck("url", getPubkeyRelays(pubkey, mode))

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
      const seen = new Set()
      const ok = []
      const bad = []

      for (const url of chain(hints, User.getRelayUrls("write"), Env.DEFAULT_RELAYS)) {
        if (seen.has(url)) {
          continue
        }

        seen.add(url)

        // Filter out relays that appear to be broken or slow
        if (!isShareableRelay(url)) {
          bad.push(url)
        } else if (Network.relayHasError(url) || first(Meta.getRelayQuality(url)) < 0.5) {
          bad.push(url)
        } else {
          ok.push(url)
        }

        if (ok.length > limit) {
          break
        }
      }

      // If we don't have enough hints, use the broken ones
      return ok.concat(bad).slice(0, limit)
    }

    const hintSelector =
      generateHints =>
      (limit, ...args) =>
        selectHints(limit, generateHints(...args))

    const getPubkeyHints = hintSelector(function* (pubkey, mode = "write") {
      const other = mode === "write" ? "read" : "write"

      yield* getPubkeyRelayUrls(pubkey, mode)
      yield* getPubkeyRelayUrls(pubkey, other)
    })

    const getEventHints = hintSelector(function* (event) {
      yield* event.seen_on || []
      yield* getPubkeyHints(null, event.pubkey)
    })

    // If we're looking for an event's children, the read relays the author has
    // advertised would be the most reliable option, since well-behaved clients
    // will write replies there. However, this may include spam, so we may want
    // to read from the current user's network's read relays instead.
    const getReplyHints = hintSelector(function* (event) {
      yield* getPubkeyRelayUrls(event.pubkey, "write")
      yield* event.seen_on || []
      yield* getPubkeyRelayUrls(event.pubkey, "read")
    })

    // If we're looking for an event's parent, tags are the most reliable hint,
    // but we can also look at where the author of the note reads from
    const getParentHints = hintSelector(function* (event) {
      const parentId = findReplyId(event)

      yield* Tags.from(event).equals(parentId).relays()
      yield* event.seen_on || []
      yield* getPubkeyHints(null, event.pubkey, "read")
    })

    // If we're replying or reacting to an event, we want the author to know, as well as
    // anyone else who is tagged in the original event or the reply. Get everyone's read
    // relays. Limit how many per pubkey we publish to though. We also want to advertise
    // our content to our followers, so publish to our write relays as well.
    const getPublishHints = (limit, event, extraRelays = []) => {
      const tags = Tags.from(event)
      const pubkeys = tags.type("p").values().all().concat(event.pubkey)
      const hintGroups = pubkeys.map(pubkey => getPubkeyHints(3, pubkey, "read"))

      return mergeHints(limit, hintGroups.concat([extraRelays]))
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

    return {
      addRelay,
      setPolicy,
      getRelay,
      getRelayInfo,
      displayRelay,
      searchRelays,
      getSearchRelays,
      getPubkeyRelays,
      getPubkeyRelayUrls,
      selectHints,
      hintSelector,
      getPubkeyHints,
      getEventHints,
      getReplyHints,
      getParentHints,
      getPublishHints,
      mergeHints,
    }
  }

  static initialize({Env, Events, Nip65}) {
    Events.addHandler(2, e => {
      if (isShareableRelay(e.content)) {
        Nip65.addRelay(normalizeRelayUrl(e.content))
      }
    })

    Events.addHandler(3, e => {
      Nip65.setPolicy(
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

    Events.addHandler(10002, e => {
      Nip65.setPolicy(
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
    ;(async () => {
      const {DEFAULT_RELAYS, FORCE_RELAYS, DUFFLEPUD_URL} = Env

      // Throw some hardcoded defaults in there
      DEFAULT_RELAYS.forEach(Nip65.addRelay)

      // Load relays from nostr.watch via dufflepud
      if (FORCE_RELAYS.length === 0 && DUFFLEPUD_URL) {
        try {
          const json = await Fetch.fetchJson(DUFFLEPUD_URL + "/relay")

          json.relays.filter(isShareableRelay).forEach(Nip65.addRelay)
        } catch (e) {
          warn("Failed to fetch relays list", e)
        }
      }
    })()
  }
}
