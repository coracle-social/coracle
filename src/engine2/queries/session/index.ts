import {find, defaultTo, whereEq} from "ramda"
import type {KeyState} from "src/engine2/model"
import {derived} from "src/engine2/util/store"
import {pubkey, keys} from "src/engine2/state"
import {prepareNdk, ndkInstances} from "./ndk"
import {Signer} from "./signer"
import {Nip04} from "./nip04"
import {Nip44} from "./nip44"
import {Wrapper} from "./wrapper"

export const stateKey = pubkey.derived(defaultTo("anonymous"))

export const user = derived([pubkey, keys], ([$pubkey, $keys]) => {
  return find(whereEq({pubkey: $pubkey}), $keys) as KeyState | null
})

export const canSign = user.derived(({method}) =>
  ["bunker", "privkey", "extension"].includes(method)
)

export const ndk = derived([user, ndkInstances], ([$user, $instances]) => {
  if (!$user?.bunkerToken) {
    return null
  }

  if (!$instances.has($user.pubkey)) {
    $instances.set($user.pubkey, prepareNdk($user))
  }

  return $instances.get($user.pubkey)
})

export const nip04 = derived([user, ndk], ([$user, $ndk]) => new Nip04($user, $ndk))

export const nip44 = derived([user], ([$user]) => new Nip44($user))

export const signer = derived([user, ndk], ([$user, $ndk]) => new Signer($user, $ndk))

export const wrapper = derived(
  [user, nip44, signer],
  ([$user, $nip44, $signer]) => new Wrapper($user, $nip44, $signer)
)
