import {sessions} from "../state"
import {getNdk} from "./ndk"
import {Nip04} from "./nip04"
import {Nip44} from "./nip44"
import {Nip59} from "./nip59"
import {Signer} from "./signer"

export * from "./ndk"
export * from "./nip04"
export * from "./nip07"
export * from "./nip44"
export * from "./nip59"
export * from "./settings"
export * from "./signer"

export const getSession = pubkey => sessions.get()[pubkey]

export const getNip44 = session => new Nip44(session)

export const getNip04 = session => new Nip04(session, getNdk(session))

export const getSigner = session => new Signer(session, getNdk(session))

export const getNip59 = session =>
  new Nip59(session, getNip04(session), getNip44(session), getSigner(session))
