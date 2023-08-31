import {uniqBy, prop, inc} from "ramda"
import {tryJson, now} from "src/util/misc"
import {warn} from "src/util/logger"
import {normalizeRelayUrl, isShareableRelay, Tags} from "src/util/nostr"
import type {RelayPolicyEntry} from "src/engine2/model"
import {RelayMode} from "src/engine2/model"
import {relays, relayPolicies} from "src/engine2/state"
import {projections} from "src/engine2/projections/core"

const addRelay = (url: string) => {
  if (isShareableRelay(url)) {
    const relay = relays.key(url).get()

    relays.key(url).merge({
      count: inc(relay?.count || 0),
      first_seen: relay?.first_seen || now(),
      info: {
        last_checked: 0,
      },
    })
  }
}

const setPolicy = (
  {pubkey, created_at}: {pubkey: string; created_at: number},
  relays: RelayPolicyEntry[]
) => {
  if (relays?.length > 0) {
    if (created_at < relayPolicies.key(pubkey).get()?.created_at) {
      return
    }

    relayPolicies.key(pubkey).merge({
      created_at,
      updated_at: now(),
      relays: uniqBy(prop("url"), relays).map((relay: RelayPolicyEntry) => {
        addRelay(relay.url)

        return {read: true, write: true, ...relay}
      }),
    })
  }
}

projections.addHandler(2, e => {
  addRelay(normalizeRelayUrl(e.content))
})

projections.addHandler(3, e => {
  setPolicy(
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

projections.addHandler(10002, e => {
  setPolicy(
    e,
    Tags.from(e)
      .type("r")
      .all()
      .map(([_, url, mode]) => {
        const write = !mode || mode === RelayMode.Write
        const read = !mode || mode === RelayMode.Read

        if (!write && !read) {
          warn(`Encountered unknown relay mode: ${mode}`)
        }

        return {url: normalizeRelayUrl(url), write, read}
      })
  )
})
