import {nip19} from "nostr-tools"
import {propEq} from "ramda"
import {createMap} from "hurdak"
import {derived} from "src/engine2/util/store"
import {session, events, people} from "src/engine2/state"
import {prepareNdk, ndkInstances} from "./ndk"
import {Signer} from "./signer"
import {Nip04} from "./nip04"
import {Nip44} from "./nip44"
import {Nip59} from "./nip59"

export const isKeyValid = (key: string) => {
  // Validate the key before setting it to state by encoding it using bech32.
  // This will error if invalid (this works whether it's a public or a private key)
  try {
    nip19.npubEncode(key)
  } catch (e) {
    return false
  }

  return true
}

export const stateKey = session.derived($s => $s?.pubkey || "anonymous")

export const user = derived([session, people.mapStore], ([$s, $p]) => $p.get($s?.pubkey))

export const userEvents = derived([session, events], ([$session, $events]) => {
  return $session ? $events.filter(propEq("pubkey", $session.pubkey)) : []
})

export const userEventsById = userEvents.derived($events => createMap("id", $events))

export const canSign = session.derived($session =>
  ["bunker", "privkey", "extension"].includes($session?.method)
)

export const canUseGiftWrap = session.derived($session => $session?.method === "privkey")

export const ndk = derived([session, ndkInstances], ([$session, $instances]) => {
  if (!$session?.bunkerToken) {
    return null
  }

  if (!$instances.has($session.pubkey)) {
    $instances.set($session.pubkey, prepareNdk($session))
  }

  return $instances.get($session.pubkey)
})

export const signer = derived([session, ndk], ([$session, $ndk]) => new Signer($session, $ndk))

export const nip04 = derived([session, ndk], ([$session, $ndk]) => new Nip04($session, $ndk))

export const nip44 = derived([session], ([$session]) => new Nip44($session))

export const nip59 = derived(
  [session, nip44, signer],
  ([$session, $nip44, $signer]) => new Nip59($session, $nip44, $signer)
)
