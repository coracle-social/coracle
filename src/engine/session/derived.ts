import {derived} from "src/engine/core/utils"
import type {Person} from "src/engine/people/model"
import {people} from "src/engine/people/state"
import type {Session} from "./model"
import {sessions, pubkey} from "./state"
import {getSettings, getNdk, getSigner, getNip04, getNip44, getNip59, getConnect} from "./utils"

export const stateKey = pubkey.derived($pk => $pk || "anonymous")

export const session = derived(
  [pubkey, sessions],
  ([$pk, $sessions]: [string, Record<string, Session>]) => ($pk ? $sessions[$pk] : null),
)

export const user = derived(
  [stateKey, people.mapStore],
  ([$k, $p]: [string, Map<string, Person>]) => $p.get($k) || {pubkey: $k},
)

export const ndk = session.derived(getNdk)

export const signer = session.derived(getSigner)

export const nip04 = session.derived(getNip04)

export const nip44 = session.derived(getNip44)

export const nip59 = session.derived(getNip59)

export const connect = session.derived(getConnect)

export const canSign = signer.derived($signer => $signer.isEnabled())

export const settings = user.derived(getSettings)
