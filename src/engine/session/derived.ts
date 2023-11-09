import {derived} from "src/engine/core/utils"
import {people} from "src/engine/people/state"
import {sessions, pubkey} from "./state"
import {getSettings, getNdk, Signer, Nip04, Nip44, Nip59} from "./utils"

export const stateKey = pubkey.derived($pk => $pk || "anonymous")

export const session = derived([pubkey, sessions], ([$pk, $sessions]) =>
  $pk ? $sessions[$pk] : null
)

export const user = derived([stateKey, people.mapStore], ([$k, $p]) => $p.get($k))

export const ndk = session.derived(getNdk)

export const signer = derived([session, ndk], ([$session, $ndk]) => new Signer($session, $ndk))

export const nip04 = derived([session, ndk], ([$session, $ndk]) => new Nip04($session, $ndk))

export const nip44 = derived([session], ([$session]) => new Nip44($session))

export const nip59 = derived(
  [session, nip44, signer],
  ([$session, $nip44, $signer]) => new Nip59($session, $nip44, $signer)
)

export const canSign = signer.derived($signer => $signer.canSign())

export const canUseGiftWrap = session.derived($session => $session?.method === "privkey")

export const settings = user.derived(getSettings)
