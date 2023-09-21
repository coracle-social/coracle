import {whereEq, when, reject} from "ramda"
import {now} from "src/util/misc"
import {isShareableRelay, normalizeRelayUrl} from "src/util/nostr"
import type {RelayPolicy} from "src/engine/model"
import {people} from "src/engine/state"
import {canSign, stateKey, relayPolicies} from "src/engine/queries"
import {updateStore} from "src/engine/projections"
import {publishEvent} from "./util"

export const publishRelays = async ($relays: RelayPolicy[]) => {
  if (canSign.get()) {
    publishEvent(10002, {
      tags: $relays
        .filter(r => isShareableRelay(r.url))
        .map(r => {
          const t = ["r", normalizeRelayUrl(r.url)]

          if (!r.write) {
            t.push("read")
          }

          return t
        }),
    })
  } else {
    updateStore(people.key(stateKey.get()), now(), {relays: $relays})
  }
}

export const addRelay = (url: string) => {
  return publishRelays([
    ...reject(whereEq({url}), relayPolicies.get()),
    {url, read: true, write: true} as RelayPolicy,
  ])
}

export const removeRelay = (url: string) =>
  publishRelays(reject(whereEq({url}), relayPolicies.get()))

export const setRelayPolicy = (url: string, policy: Partial<RelayPolicy>) =>
  publishRelays(relayPolicies.get().map(when(whereEq({url}), p => ({...p, ...policy}))))
