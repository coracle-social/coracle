import {omit, assoc} from "ramda"
import {generatePrivateKey, getPublicKey} from "nostr-tools"
import type {Session} from "src/engine2/model"
import {pool, sessions, session} from "src/engine2/state"
import {canSign, signer} from "src/engine2/queries"
import {buildEvent} from "./util"

const addSession = (s: Session) => {
  sessions.update(assoc(s.pubkey, s))
  session.set(s)
}

export const loginWithPrivateKey = privkey =>
  addSession({method: "privkey", pubkey: getPublicKey(privkey), privkey})

export const loginWithPublicKey = pubkey => addSession({method: "pubkey", pubkey})

export const loginWithExtension = pubkey => addSession({method: "extension", pubkey})

export const loginWithNsecBunker = (pubkey, bunkerToken) =>
  addSession({method: "bunker", pubkey, bunkerKey: generatePrivateKey(), bunkerToken})

export const logoutPubkey = pubkey => {
  if (session.get().pubkey === pubkey) {
    throw new Error("Can't destroy the current session, use logout instead")
  }

  sessions.update(omit([pubkey]))
}

export const logout = () => {
  session.set(null)
  sessions.set({})
}

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
