import {reject} from "ramda"
import {now} from "@coracle.social/lib"
import {stateKey, user, canSign, session} from "src/engine/session/derived"
import {updateStore} from "src/engine/core/commands"
import {createAndPublish, getClientTags, mention} from "src/engine/network/utils"
import {hints, forcePlatformRelays, withIndexers} from "src/engine/relays/utils"
import {people} from "./state"

export const publishProfile = profile =>
  createAndPublish({
    kind: 0,
    tags: getClientTags(),
    content: JSON.stringify(profile),
    relays: forcePlatformRelays(withIndexers(hints.WriteRelays().getUrls())),
  })

export const publishPetnames = (petnames: string[][]) => {
  updateStore(people.key(stateKey.get()), now(), {petnames})

  if (canSign.get()) {
    createAndPublish({
      kind: 3,
      tags: [...petnames, ...getClientTags()],
      content: session.get().kind3?.content || "",
      relays: forcePlatformRelays(withIndexers(hints.WriteRelays().getUrls())),
    })
  }
}

export const follow = (type: string, value: string) => {
  const tag = type === "p" ? mention(value) : [type, value]

  return publishPetnames([
    ...reject((t: string[]) => t[1] === value, user.get()?.petnames || []),
    tag,
  ])
}

export const unfollow = (value: string) =>
  publishPetnames(reject((t: string[]) => t[1] === value, user.get()?.petnames || []))

export const publishMutes = ($mutes: string[][]) => {
  updateStore(people.key(stateKey.get()), now(), {mutes: $mutes})

  if (canSign.get()) {
    return createAndPublish({
      kind: 10000,
      tags: [...$mutes.map(t => t.slice(0, 2)), ...getClientTags()],
      relays: forcePlatformRelays(hints.WriteRelays().getUrls()),
    })
  }
}

export const mute = (type: string, pubkey: string) =>
  publishMutes([
    ...reject((t: string[]) => t[1] === pubkey, user.get()?.mutes || []),
    [type, pubkey],
  ])

export const unmute = (value: string) =>
  publishMutes(reject((t: string[]) => t[1] === value, user.get()?.mutes || []))
