import {sortBy, pluck, uniq, nth, uniqBy, prop, last, inc} from "ramda"
import type {Readable} from "svelte/store"
import {fuzzy, chain, tryJson, now, fetchJson} from "src/util/misc"
import {warn} from "src/util/logger"
import {normalizeRelayUrl, findReplyId, isShareableRelay, Tags} from "src/util/nostr"
import type {Table} from "src/util/loki"
import type {Sync} from "src/system/components/Sync"
import type {Relay, RelayInfo, RelayPolicy} from "src/system/types"

export type RoutingOpts = {
  getDefaultRelays: () => string[]
  relayHasError: (url: string) => boolean
}

export class Routing {
  sync: Sync
  relays: Table<Relay>
  policies: Table<RelayPolicy>
  searchRelays: Readable<(query: string) => Relay[]>
  constructor(sync, readonly opts: RoutingOpts) {
    this.sync = sync
    this.relays = sync.table("routing/relays", "url", {sort: sortBy(e => -e.count)})
    this.policies = sync.table("routing/policies", "pubkey", {sort: sync.sortByPubkeyWhitelist})
    this.searchRelays = this.relays.watch(() => fuzzy(this.relays.all(), {keys: ["url"]}))

    sync.addHandler(2, e => {
      if (isShareableRelay(e.content)) {
        this.addRelay(normalizeRelayUrl(e.content))
      }
    })

    sync.addHandler(3, e => {
      this.setPolicy(
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
      this.setPolicy(
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
      const {DEFAULT_RELAYS, FORCE_RELAYS, DUFFLEPUD_URL} = this.sync.env

      // Throw some hardcoded defaults in there
      DEFAULT_RELAYS.forEach(this.addRelay)

      // Load relays from nostr.watch via dufflepud
      if (FORCE_RELAYS.length === 0 && DUFFLEPUD_URL) {
        try {
          const json = await fetchJson(DUFFLEPUD_URL + "/relay")

          json.relays.filter(isShareableRelay).forEach(this.addRelay)
        } catch (e) {
          warn("Failed to fetch relays list", e)
        }
      }
    })()
  }

  addRelay = url => {
    const relay = this.relays.get(url)

    this.relays.patch({
      url,
      count: inc(relay?.count || 0),
      first_seen: relay?.first_seen || now(),
      info: {
        last_checked: 0,
      },
    })
  }

  setPolicy = ({pubkey, created_at}, relays) => {
    if (relays?.length > 0) {
      if (created_at < this.policies.get(pubkey)?.created_at) {
        return
      }

      this.policies.patch({
        pubkey,
        created_at,
        updated_at: now(),
        relays: uniqBy(prop("url"), relays).map(relay => {
          this.addRelay(relay.url)

          return {read: true, write: true, ...relay}
        }),
      })
    }
  }

  getRelay = (url: string): Relay => this.relays.get(url) || {url}

  getRelayInfo = (url: string): RelayInfo => this.relays.get(url)?.info || {}

  displayRelay = ({url}) => last(url.split("://"))

  getSearchRelays = () => {
    const searchableRelayUrls = pluck(
      "url",
      this.relays.all({"info.supported_nips": {$contains: 50}})
    )

    return uniq(this.sync.env.SEARCH_RELAYS.concat(searchableRelayUrls)).slice(0, 8)
  }

  getPubkeyRelays = (pubkey, mode = null) => {
    const relays = this.policies.get(pubkey)?.relays || []

    return mode ? relays.filter(prop(mode)) : relays
  }

  getPubkeyRelayUrls = (pubkey, mode = null) => pluck("url", this.getPubkeyRelays(pubkey, mode))

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

  selectHints = (limit, hints) => {
    const seen = new Set()
    const ok = []
    const bad = []

    for (const url of chain(hints, this.opts.getDefaultRelays())) {
      if (seen.has(url)) {
        continue
      }

      seen.add(url)

      // Filter out relays that appear to be broken or slow
      if (!isShareableRelay(url)) {
        bad.push(url)
      } else if (this.opts.relayHasError(url)) {
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

  hintSelector =
    generateHints =>
    (limit, ...args) =>
      this.selectHints(limit, generateHints.call(this, ...args))

  getPubkeyHints = this.hintSelector(function* (pubkey, mode = "write") {
    const other = mode === "write" ? "read" : "write"

    yield* this.getPubkeyRelayUrls(pubkey, mode)
    yield* this.getPubkeyRelayUrls(pubkey, other)
  })

  getEventHints = this.hintSelector(function* (event) {
    yield* event.seen_on || []
    yield* this.getPubkeyHints(null, event.pubkey)
  })

  // If we're looking for an event's children, the read relays the author has
  // advertised would be the most reliable option, since well-behaved clients
  // will write replies there. However, this may include spam, so we may want
  // to read from the current user's network's read relays instead.
  getReplyHints = this.hintSelector(function* (event) {
    yield* this.getPubkeyRelayUrls(event.pubkey, "write")
    yield* event.seen_on || []
    yield* this.getPubkeyRelayUrls(event.pubkey, "read")
  })

  // If we're looking for an event's parent, tags are the most reliable hint,
  // but we can also look at where the author of the note reads from
  getParentHints = this.hintSelector(function* (event) {
    const parentId = findReplyId(event)

    yield* Tags.from(event).equals(parentId).relays()
    yield* event.seen_on || []
    yield* this.getPubkeyHints(null, event.pubkey, "read")
  })

  // If we're replying or reacting to an event, we want the author to know, as well as
  // anyone else who is tagged in the original event or the reply. Get everyone's read
  // relays. Limit how many per pubkey we publish to though. We also want to advertise
  // our content to our followers, so publish to our write relays as well.
  getPublishHints = (limit, event, extraRelays = []) => {
    const tags = Tags.from(event)
    const pubkeys = tags.type("p").values().all().concat(event.pubkey)
    const hintGroups = pubkeys.map(pubkey => this.getPubkeyHints(3, pubkey, "read"))

    return this.mergeHints(limit, hintGroups.concat([extraRelays]))
  }

  mergeHints = (limit, groups) => {
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
}
