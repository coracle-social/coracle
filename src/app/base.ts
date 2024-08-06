import type {SignedEvent} from "@welshman/util"
import {Repository, Relay} from "@welshman/util"
import {NetworkContext, Tracker} from "@welshman/net"

export const DUFFLEPUD_URL = "https://dufflepud.onrender.com"

export const repository = new Repository()

export const relay = new Relay(repository)

export const tracker = new Tracker()

const seenChallenges = new Set()

Object.assign(NetworkContext, {
  onEvent: (url: string, event: SignedEvent) => tracker.track(event.id, url),
  isDeleted: (url: string, event: SignedEvent) => repository.isDeleted(event),
  // onAuth: async (url, challenge) => {
  //   if (seenChallenges.has(challenge)) {
  //     return
  //   }

  //   seenChallenges.add(challenge)

  //   const event = await signer.get().signAsUser(
  //     createEvent(22242, {
  //       tags: [
  //         ["relay", url],
  //         ["challenge", challenge],
  //       ],
  //     }),
  //   )

  //   NetworkContext.pool.get(url).send(["AUTH", event])

  //   return event
  // },
})
