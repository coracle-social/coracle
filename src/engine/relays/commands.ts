import {whereEq, when, reject, uniqBy, prop, inc} from "ramda"
import {now} from "@coracle.social/lib"
import {normalizeRelayUrl, createEvent, isShareableRelayUrl} from "@coracle.social/util"
import {people} from "src/engine/people/state"
import {session, canSign, signer, stateKey} from "src/engine/session/derived"
import {updateStore} from "src/engine/core/commands"
import {createAndPublish, getClientTags, Publisher} from "src/engine/network/utils"
import type {RelayPolicy} from "./model"
import {relays} from "./state"
import {relayPolicies} from "./derived"

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

export const publishRelays = ($relays: RelayPolicy[]) => {
  if (canSign.get()) {
    return createAndPublish(10002, {
      tags: $relays
        .filter(r => isShareableRelayUrl(r.url))
        .map(r => {
          const t = ["r", normalizeRelayUrl(r.url)]

          if (!r.write) {
            t.push("read")
          }

          return t
        })
        .concat(getClientTags()),
    })
  } else {
    updateStore(people.key(stateKey.get()), now(), {relays: $relays})
  }
}

export const joinRelay = async (url: string, claim?: string) => {
  url = normalizeRelayUrl(url)

  if (claim && canSign.get()) {
    const pub = Publisher.publish({
      relays: [url],
      event: await signer.get().signAsUser(
        createEvent(28934, {
          tags: [["claim", claim]],
        }),
      ),
    })

    await pub.result
  }

  // Re-publish user meta to the new relay
  if (canSign.get() && session.get().kind3) {
    Publisher.publish({event: session.get().kind3, relays: [url]})
  }

  return publishRelays([
    ...reject(whereEq({url}), relayPolicies.get()),
    {url, read: true, write: true} as RelayPolicy,
  ])
}

export const leaveRelay = (url: string) =>
  publishRelays(reject(whereEq({url}), relayPolicies.get()))

export const setRelayPolicy = (url: string, policy: Partial<RelayPolicy>) =>
  publishRelays(relayPolicies.get().map(when(whereEq({url}), p => ({...p, ...policy}))))
