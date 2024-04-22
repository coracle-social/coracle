import {whereEq, reject, uniqBy, prop, inc} from "ramda"
import {now} from "@welshman/lib"
import {Tag, normalizeRelayUrl, isShareableRelayUrl} from "@welshman/util"
import {people} from "src/engine/people/state"
import {session, canSign, stateKey} from "src/engine/session/derived"
import {updateStore} from "src/engine/core/commands"
import {getClientTags, publish, createAndPublish} from "src/engine/network/utils"
import type {RelayPolicy} from "./model"
import {relays} from "./state"
import {relayPolicies} from "./derived"
import {hints, forcePlatformRelays, withIndexers} from "./utils"

export const saveRelay = (url: string) => {
  url = normalizeRelayUrl(url)

  if (isShareableRelayUrl(url)) {
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

export const saveRelayPolicy = (e, relays: RelayPolicy[]) => {
  if (relays?.length > 0) {
    updateStore(people.key(e.pubkey), e.created_at, {
      relays: uniqBy(prop("url"), relays).map((relay: RelayPolicy) => {
        saveRelay(relay.url)

        return {read: true, write: true, ...relay}
      }),
    })
  }
}

export const publishRelays = async ($relays: RelayPolicy[]) => {
  updateStore(people.key(stateKey.get()), now(), {relays: $relays})

  if (canSign.get()) {
    createAndPublish({
      kind: 10002,
      tags: $relays
        .filter(r => isShareableRelayUrl(r.url))
        .flatMap(r => {
          const tag = Tag.from(["r", normalizeRelayUrl(r.url)])

          if (r.read && r.write) return [tag.valueOf()]
          if (r.write) return [tag.append("write").valueOf()]
          if (r.read) return [tag.append("read").valueOf()]

          return []
        })
        .concat(getClientTags()),
      relays: withIndexers(forcePlatformRelays(hints.WriteRelays().getUrls())),
    })
  }
}

export const requestRelayAccess = async (url: string, claim: string, sk?: string) =>
  createAndPublish({
    kind: 28934,
    tags: [["claim", claim]],
    relays: [url],
    sk,
  })

export const joinRelay = async (url: string, claim?: string) => {
  url = normalizeRelayUrl(url)

  if (claim && canSign.get()) {
    await requestRelayAccess(url, claim)
  }

  // Re-publish user meta to the new relay
  if (canSign.get() && session.get().kind3) {
    publish({event: session.get().kind3, relays: [url]})
  }

  return publishRelays([
    ...reject(whereEq({url}), relayPolicies.get()),
    {url, read: true, write: true} as RelayPolicy,
  ])
}

export const leaveRelay = (url: string) =>
  publishRelays(reject(whereEq({url}), relayPolicies.get()))

export const setRelayPolicy = (url: string, policy: Partial<RelayPolicy>) =>
  publishRelays(
    relayPolicies
      .get()
      .filter(p => p.url !== url)
      .concat({url, read: false, write: false, ...policy}),
  )
