import {sortBy, last, inc} from "ramda"
import {fuzzy, tryJson, now, fetchJson} from "src/util/misc"
import {warn} from "src/util/logger"
import {normalizeRelayUrl, isShareableRelay} from "src/util/nostr"
import {DUFFLEPUD_URL, DEFAULT_RELAYS, FORCE_RELAYS} from "src/system/env"
import {Table, watch} from "src/agent/db"

export default ({sync, sortByGraph}) => {
  const relays = new Table("routing/relays", "url", {sort: sortBy(e => -e.count)})
  const relaySelections = new Table("routing/relaySelections", "pubkey", {sort: sortByGraph})

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

  const addPolicies = ({pubkey, created_at}, policies) => {
    if (policies?.length > 0) {
      const selection = relaySelections.get(pubkey)

      if (created_at < selection?.created_at) {
        return
      }

      policies.forEach(({url}) => addRelay(url))
      relaySelections.patch({pubkey, created_at, policies})
    }
  }

  sync.addHandler(2, e => {
    if (isShareableRelay(e.content)) {
      addRelay(normalizeRelayUrl(e.content))
    }
  })

  sync.addHandler(3, e => {
    addPolicies(
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
    addPolicies(
      e,
      e.tags.map(([_, url, mode = "read"]) => {
        const write = mode === "write"
        const read = mode === "read"

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
    relaySelections,
    getRelay,
    getRelayMeta,
    searchRelays,
    displayRelay,
    initialize,
  }
}
