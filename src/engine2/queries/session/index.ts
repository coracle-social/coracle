import {find, whereEq} from "ramda"
import {derived} from "src/engine2/util/store"
import {pubkey, keys} from "src/engine2/state"
import {prepareNdk, ndkInstances} from "./ndk"
import {Signer} from "./signer"
import {Crypto} from "./crypto"
import {Wrapper} from "./wrapper"

export const user = derived([pubkey, keys], ([$pubkey, $keys]) => {
  return find(whereEq({pubkey: $pubkey}), $keys)
})

export const ndk = derived([user, ndkInstances], ([$user, $instances]) => {
  if (!$user?.bunkerToken) {
    return null
  }

  if (!$instances.has($user.pubkey)) {
    $instances.set($user.pubkey, prepareNdk($user))
  }

  return $instances.get($user.pubkey)
})

export const crypto = derived([user], ([$user]) => new Crypto($user))

export const signer = derived([user, ndk], ([$user, $ndk]) => new Signer($user, $ndk))

export const wrapper = derived(
  [user, crypto, signer],
  ([$user, $crypto, $signer]) => new Wrapper($user, $crypto, $signer)
)
