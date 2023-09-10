import {reject, whereEq} from "ramda"
import {generatePrivateKey, getPublicKey} from "nostr-tools"
import type {KeyState} from "src/engine2/model"
import {pool, keys, pubkey} from "src/engine2/state"
import {canSign, signer} from "src/engine2/queries"
import {buildEvent} from "./util"

const addKey = (v: KeyState) => {
  keys.update((s: KeyState[]) => reject(whereEq({pubkey: v.pubkey}), s).concat(v))
  pubkey.set(v.pubkey)
}

export const loginWithPrivateKey = privkey =>
  addKey({method: "privkey", pubkey: getPublicKey(privkey), privkey})

export const loginWithPublicKey = pubkey => addKey({method: "pubkey", pubkey})

export const loginWithExtension = pubkey => addKey({method: "extension", pubkey})

export const loginWithNsecBunker = (pubkey, bunkerToken) =>
  addKey({method: "bunker", pubkey, bunkerKey: generatePrivateKey(), bunkerToken})

const seenChallenges = new Set()

export const handleAuth = async (url, challenge) => {
  if (canSign.get() && !seenChallenges.has(challenge)) {
    seenChallenges.add(challenge)

    const event = signer.get().signAsUser(
      buildEvent(22242, {
        tags: [
          ["challenge", challenge],
          ["relay", url],
        ],
      })
    )

    pool.get(url).send(["AUTH", event])

    return event
  }
}
