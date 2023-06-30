import {sortBy, nth, prop, inc} from 'ramda'
import {fuzzy} from "src/util/misc"
import {Tags} from "src/util/nostr"
import {Table, watch} from "src/agent/db"

export default ({sync, sortByGraph) => {
  const relays = new Table("routing/relays", "url", {sort: sortBy(e => -e.count)})
  const relaySelections = new Table("routing/relaySelections", "pubkey", {sort: sortByGraph})

  const processTopics = e => {
    const tagTopics = Tags.from(e).topics()
    const contentTopics = Array.from(e.content.toLowerCase().matchAll(/#(\w{2,100})/g)).map(nth(1))

    for (const name of tagTopics.concat(contentTopics)) {
      const topic = topics.get(name)

      topics.patch({name, count: inc(topic?.count || 0)})
    }
  }

  const addRelay = url => {
    const relay = relays.get(url)

    relays.patch({url, count: inc(relay?.count || 0)})
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
    addPolicies(e, tryJson(() => {
      Object.entries(JSON.parse(e.content || ""))
        .filter(([url]) => isShareableRelay(url))
        .map(([url, conditions]) => {
          const write = ![false, '!'].includes(conditions.write)
          const read = ![false, '!'].includes(conditions.read)

          return {url: normalizeRelayUrl(url), write, read}
        })
    }))
  })

  sync.addHandler(10002, e => {
    addPolicies(e, e.tags.map(([_, url, mode]) => {
      const write = mode === 'write'
      const read = mode === 'read'

      if (!write && !read) {
        warn(`Encountered unknown relay mode: ${mode}`)
      }

      return {url: normalizeRelayUrl(url), write, read}
    }))
  })

  const getRelay = url => relays.get(url) || {url}

  const searchRelays = watch(relays, () => fuzzy(relays.all(), {keys: ["url"]}))


  return {
    relays,
    relaySelections,
    getRelay,
    searchRelays,
  }
}
