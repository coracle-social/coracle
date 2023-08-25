import {reject, whereEq} from "ramda"
import {generatePrivateKey, getPublicKey} from "nostr-tools"
import type {KeyState} from "src/engine2/model"
import * as state from "src/engine2/state"

const addKey = (v: KeyState) => {
  state.keys.update((s: KeyState[]) => reject(whereEq({pubkey: v.pubkey}), s).concat(v))
  state.pubkey.set(v.pubkey)
}

export const loginWithPrivateKey = privkey =>
  addKey({method: "privkey", pubkey: getPublicKey(privkey), privkey})

export const loginWithPublicKey = pubkey => addKey({method: "pubkey", pubkey})

export const loginWithExtension = pubkey => addKey({method: "extension", pubkey})

export const loginWithNsecBunker = (pubkey, bunkerToken) =>
  addKey({method: "bunker", pubkey, bunkerKey: generatePrivateKey(), bunkerToken})
