import {reject} from "ramda"
import {now} from "paravel"
import {stateKey, user, canSign} from "src/engine/session/derived"
import {updateStore} from "src/engine/core/commands"
import {publishEvent, mention} from "src/engine/network/utils"
import {people} from "./state"

export const publishProfile = profile => publishEvent(0, {content: JSON.stringify(profile)})

export const publishPetnames = ($petnames: string[][]) => {
  updateStore(people.key(stateKey.get()), now(), {petnames: $petnames})

  if (canSign.get()) {
    return publishEvent(3, {tags: $petnames})
  }
}

export const follow = (type: string, value: string) => {
  const tag = type === "p" ? mention(value) : [type, value]

  return publishPetnames([
    ...reject((t: string[]) => t[1] === value, user.get().petnames || []),
    tag,
  ])
}

export const unfollow = (value: string) =>
  publishPetnames(reject((t: string[]) => t[1] === value, user.get().petnames || []))

export const publishMutes = ($mutes: string[][]) => {
  updateStore(people.key(stateKey.get()), now(), {mutes: $mutes})

  if (canSign.get()) {
    return publishEvent(10000, {tags: $mutes.map(t => t.slice(0, 2))})
  }
}

export const mute = (type: string, pubkey: string) =>
  publishMutes([
    ...reject((t: string[]) => t[1] === pubkey, user.get().mutes || []),
    [type, pubkey],
  ])

export const unmute = (value: string) =>
  publishMutes(reject((t: string[]) => t[1] === value, user.get().mutes || []))
