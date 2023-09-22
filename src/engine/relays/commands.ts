import {whereEq, when, reject, uniqBy, prop, inc} from "ramda"
import {now} from "src/util/misc"
import {people} from "src/engine/people/state"
import {canSign, stateKey} from "src/engine/session/derived"
import {updateStore} from "src/engine/core/commands"
import {publishEvent} from "src/engine/network/utils"
import {normalizeRelayUrl, isShareableRelay} from "./utils"
import type {RelayPolicy} from "./model"
import {relays} from "./state"
import {relayPolicies} from './derived'

export const saveRelay = (url: string) => {
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

export const joinRelay = (url: string) => {
  return publishRelays([
    ...reject(whereEq({url}), relayPolicies.get()),
    {url, read: true, write: true} as RelayPolicy,
  ])
}

export const leaveRelay = (url: string) =>
  publishRelays(reject(whereEq({url}), relayPolicies.get()))

export const setRelayPolicy = (url: string, policy: Partial<RelayPolicy>) =>
  publishRelays(relayPolicies.get().map(when(whereEq({url}), p => ({...p, ...policy}))))
