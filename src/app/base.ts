import {derived} from "svelte/store"
import {memoize} from '@welshman/lib'
import type {SignedEvent} from "@welshman/util"
import {Repository, createEvent, Relay} from "@welshman/util"
import {getter} from "@welshman/store"
import {NetworkContext, Tracker} from "@welshman/net"
import type {ISigner} from "@welshman/signer"
import {Nip46Broker, Nip46Signer, Nip07Signer, Nip01Signer} from '@welshman/signer'
import {synced} from '@lib/util'
import type {Session} from "@app/types"

export const INDEXER_RELAYS = ["wss://purplepag.es", "wss://relay.damus.io"]

export const DUFFLEPUD_URL = "https://dufflepud.onrender.com"

export const repository = new Repository()

export const relay = new Relay(repository)

export const tracker = new Tracker()

export const pk = synced<string | null>('pk', null)

export const sessions = synced<Record<string, Session>>('sessions', {})

export const session = derived([pk, sessions], ([$pk, $sessions]) => $pk ? $sessions[$pk] : null)

export const getSession = getter(session)

export const makeSigner = memoize((session: Session) => {
  switch (session?.method) {
    case "extension":
      return new Nip07Signer()
    case "privkey":
      return new Nip01Signer(session.secret!)
    case "connect":
      return new Nip46Signer(Nip46Broker.get(session.pubkey, session.secret!, session.handler!))
    default:
      return null
  }
})

export const signer = derived(session, makeSigner)

export const getSigner = getter(signer)

const seenChallenges = new Set()

Object.assign(NetworkContext, {
  onEvent: (url: string, event: SignedEvent) => tracker.track(event.id, url),
  isDeleted: (url: string, event: SignedEvent) => repository.isDeleted(event),
  onAuth: async (url: string, challenge: string) => {
    if (seenChallenges.has(challenge)) {
      return
    }

    seenChallenges.add(challenge)

    const event = await getSigner()!.sign(
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

