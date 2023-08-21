import {sortBy, pluck, uniq, nth, uniqBy, prop, last, inc} from "ramda"
import {chain, Fetch} from "hurdak"
import {fuzzy, tryJson, now} from "src/util/misc"
import {warn} from "src/util/logger"
import {normalizeRelayUrl, findReplyId, findRootId, isShareableRelay, Tags} from "src/util/nostr"
import type {Engine} from "src/engine/Engine"
import type {Event, Relay, RelayInfo, RelayPolicy, RelayPolicyEntry} from "src/engine/types"
import {derived, collection} from "src/engine/util/store"

export enum Mode {
  Read = "read",
  Write = "write",
}

export class Nip65 {
  engine: Engine
  relays = collection<Relay>("url")
  policies = collection<RelayPolicy>("pubkey")

  addRelay = (url: string) => {
    if (isShareableRelay(url)) {
      const relay = this.relays.key(url).get()

      this.relays.key(url).merge({
        count: inc(relay?.count || 0),
        first_seen: relay?.first_seen || now(),
        info: {
          last_checked: 0,
        },
      })
    }
  }

  setPolicy = (
    {pubkey, created_at}: {pubkey: string; created_at: number},
    relays: RelayPolicyEntry[]
  ) => {
    if (relays?.length > 0) {
      if (created_at < this.policies.key(pubkey).get()?.created_at) {
        return
      }

      this.policies.key(pubkey).merge({
        created_at,
        updated_at: now(),
        relays: uniqBy(prop("url"), relays).map((relay: RelayPolicyEntry) => {
          this.addRelay(relay.url)

          return {read: true, write: true, ...relay}
        }),
      })
    }
  }

  getRelay = (url: string): Relay => this.relays.key(url).get() || {url}

  getRelayInfo = (url: string): RelayInfo => this.getRelay(url)?.info || {}

  displayRelay = ({url}: Relay) => last(url.split("://"))

  searchRelays = derived(this.relays, $relays => fuzzy($relays.values(), {keys: ["url"]}))

  getSearchRelays = () => {
    const searchableRelayUrls = this.relays
      .get()
      .filter(r => (r.info?.supported_nips || []).includes(50))
      .map(prop("url"))

    return uniq(this.engine.Env.SEARCH_RELAYS.concat(searchableRelayUrls)).slice(0, 8)
  }

  getPubkeyRelays = (pubkey: string, mode: string = null) => {
    const relays = this.policies.key(pubkey).get()?.relays || []

    return mode ? relays.filter(prop(mode)) : relays
  }

  getPubkeyRelayUrls = (pubkey: string, mode: string = null) =>
    pluck("url", this.getPubkeyRelays(pubkey, mode))

  getUserRelays = (mode: string = null) =>
    this.getPubkeyRelays(this.engine.Keys.stateKey.get(), mode)

  getUserRelayUrls = (mode: string = null) => pluck("url", this.getUserRelays(mode))

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

  selectHints = (limit: number | null, hints: Iterable<string>) => {
    const seen = new Set()
    const ok = []
    const bad = []

    for (const url of chain(
      hints,
      this.getUserRelayUrls(Mode.Read),
      this.engine.Env.DEFAULT_RELAYS
    )) {
      if (seen.has(url)) {
        continue
      }

      seen.add(url)

      // Filter out relays that appear to be broken or slow
      if (!isShareableRelay(url)) {
        bad.push(url)
      } else if (this.engine.Network.relayIsLowQuality(url)) {
        bad.push(url)
      } else {
        ok.push(url)
      }

      if (limit && ok.length > limit) {
        break
      }
    }

    // If we don't have enough hints, use the broken ones
    return ok.concat(bad).slice(0, limit || Infinity)
  }

  hintSelector =
    (generateHints: (...args: any[]) => Iterable<string>) =>
    (limit: number, ...args: any[]) =>
      this.selectHints(limit, generateHints.call(this, ...args))

  getPubkeyHints = this.hintSelector(function* (this: Nip65, pubkey: string, mode: Mode) {
    yield* this.getPubkeyRelayUrls(pubkey, mode)
  })

  getEventHints = this.hintSelector(function* (this: Nip65, event: Event) {
    yield* this.getPubkeyRelayUrls(event.pubkey, Mode.Write)
  })

  // If we're looking for an event's children, the read relays the author has
  // advertised would be the most reliable option, since well-behaved clients
  // will write replies there.
  getReplyHints = this.hintSelector(function* (this: Nip65, event) {
    yield* this.getPubkeyRelayUrls(event.pubkey, Mode.Read)
  })

  // If we're looking for an event's parent, tags are the most reliable hint,
  // but we can also look at where the author of the note reads from
  getParentHints = this.hintSelector(function* (this: Nip65, event) {
    const parentId = findReplyId(event)

    yield* Tags.from(event).equals(parentId).relays()
    yield* this.getPubkeyRelayUrls(event.pubkey, Mode.Read)
  })

  getRootHints = this.hintSelector(function* (this: Nip65, event) {
    const rootId = findRootId(event)

    yield* Tags.from(event).equals(rootId).relays()
    yield* this.getPubkeyRelayUrls(event.pubkey, Mode.Read)
  })

  // If we're replying or reacting to an event, we want the author to know, as well as
  // anyone else who is tagged in the original event or the reply. Get everyone's read
  // relays. Limit how many per pubkey we publish to though. We also want to advertise
  // our content to our followers, so publish to our write relays as well.
  getPublishHints = (limit: number, event: Event, extraRelays: string[] = []) => {
    const pubkeys = Tags.from(event).type("p").values().all()
    const hintGroups = pubkeys.map(pubkey => this.getPubkeyRelayUrls(pubkey, Mode.Read))
    const authorRelays = this.getPubkeyRelayUrls(event.pubkey, Mode.Write)

    return this.mergeHints(limit, hintGroups.concat([extraRelays, authorRelays]))
  }

  mergeHints = (limit: number, groups: string[][]) => {
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

    return sortBy(([hint, {score}]) => score, Object.entries(scores))
      .map(nth(0))
      .slice(0, limit)
  }

  async initialize(engine: Engine) {
    this.engine = engine

    engine.Events.addHandler(2, e => {
      this.addRelay(normalizeRelayUrl(e.content))
    })

    engine.Events.addHandler(3, e => {
      this.setPolicy(
        e,
        tryJson<RelayPolicyEntry[]>(() => {
          return Object.entries(JSON.parse(e.content || ""))
            .filter(([url]) => isShareableRelay(url))
            .map(([url, conditions]) => {
              // @ts-ignore
              const write = ![false, "!"].includes(conditions.write)
              // @ts-ignore
              const read = ![false, "!"].includes(conditions.read)

              return {url: normalizeRelayUrl(url), write, read}
            })
        }) as RelayPolicyEntry[]
      )
    })

    engine.Events.addHandler(10002, e => {
      this.setPolicy(
        e,
        Tags.from(e)
          .type("r")
          .all()
          .map(([_, url, mode]) => {
            const write = !mode || mode === Mode.Write
            const read = !mode || mode === Mode.Read

            if (!write && !read) {
              warn(`Encountered unknown relay mode: ${mode}`)
            }

            return {url: normalizeRelayUrl(url), write, read}
          })
      )
    })

    const {DEFAULT_RELAYS, FORCE_RELAYS, DUFFLEPUD_URL} = engine.Env

    // Throw some hardcoded defaults in there
    DEFAULT_RELAYS.forEach(this.addRelay)

    // Load relays from nostr.watch via dufflepud
    if (FORCE_RELAYS.length === 0 && DUFFLEPUD_URL) {
      try {
        const json = await Fetch.fetchJson(DUFFLEPUD_URL + "/relay")

        json.relays.forEach(this.addRelay)
      } catch (e) {
        warn("Failed to fetch relays list", e)
      }
    }
  }
}
