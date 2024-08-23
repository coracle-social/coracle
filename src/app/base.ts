import {derived} from "svelte/store"
import {memoize, assoc} from "@welshman/lib"
import type {TrustedEvent, HashedEvent} from "@welshman/util"
import {Repository, createEvent, Relay, REACTION, ZAP_RESPONSE} from "@welshman/util"
import {withGetter} from "@welshman/store"
import {NetworkContext, Tracker} from "@welshman/net"
import {Nip46Broker, Nip46Signer, Nip07Signer, Nip01Signer} from "@welshman/signer"
import {synced} from "@lib/util"
import type {Session} from "@app/types"

export const DEFAULT_RELAYS = [
  "wss://groups.fiatjaf.com/",
  "wss://relay29.galaxoidlabs.com/",
  "wss://devrelay.highlighter.com/",
  "wss://relay.groups.nip29.com/",
]

export const INDEXER_RELAYS = ["wss://purplepag.es/", "wss://relay.damus.io/", "wss://nos.lol/"]

export const DUFFLEPUD_URL = "https://dufflepud.onrender.com"

export const REACTION_KINDS = [REACTION, ZAP_RESPONSE]

export const repository = new Repository<HashedEvent>()

export const relay = new Relay(repository)

export const tracker = new Tracker()

export const pk = withGetter(synced<string | null>("pk", null))

export const sessions = withGetter(synced<Record<string, Session>>("sessions", {}))

export const session = withGetter(
  derived([pk, sessions], ([$pk, $sessions]) => ($pk ? $sessions[$pk] : null)),
)

export const getSession = (pubkey: string) => sessions.get()[pubkey]

export const addSession = (session: Session) => {
  sessions.update(assoc(session.pubkey, session))
  pk.set(session.pubkey)
}

export const nip46Perms = "sign_event:22242,nip04_encrypt,nip04_decrypt,nip44_encrypt,nip44_decrypt"

export const getSigner = memoize((session: Session) => {
  switch (session?.method) {
    case "extension":
      return new Nip07Signer()
    case "privkey":
      return new Nip01Signer(session.secret!)
    case "nip46":
      return new Nip46Signer(Nip46Broker.get(session.pubkey, session.secret!, session.handler!))
    default:
      return null
  }
})

export const signer = withGetter(derived(session, getSigner))

const seenChallenges = new Set()

Object.assign(NetworkContext, {
  onEvent: (url: string, event: TrustedEvent) => tracker.track(event.id, url),
  isDeleted: (url: string, event: TrustedEvent) => repository.isDeleted(event),
  onAuth: async (url: string, challenge: string) => {
    if (seenChallenges.has(challenge) || !signer.get()) {
      return
    }

    seenChallenges.add(challenge)

    const event = await signer.get()!.sign(
      createEvent(22242, {
        tags: [
          ["relay", url],
          ["challenge", challenge],
        ],
      }),
    )

    NetworkContext.pool.get(url).send(["AUTH", event])

    return event
  },
})
