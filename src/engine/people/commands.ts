import {reject} from "ramda"
import {now} from "src/util/misc"
import {stateKey, user, canSign} from "src/engine/session/derived"
import {updateStore} from "src/engine/core/commands"
import {publishEvent, mention} from "src/engine/network/utils"
import {people} from "./state"

export const publishProfile = profile => publishEvent(0, {content: JSON.stringify(profile)})

export const publishPetnames = async ($petnames: string[][]) => {
  if (canSign.get()) {
    publishEvent(3, {tags: $petnames})
  } else {
    updateStore(people.key(stateKey.get()), now(), {petnames: $petnames})
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

export const publishMutes = async ($mutes: string[][]) => {
  if (canSign.get()) {
    publishEvent(10000, {tags: $mutes.map(t => t.slice(0, 2))})
  } else {
    updateStore(people.key(stateKey.get()), now(), {mutes: $mutes})
  }
}

export const mute = (type: string, pubkey: string) =>
  publishMutes([
    ...reject((t: string[]) => t[1] === pubkey, user.get().mutes || []),
    [type, pubkey],
  ])

export const unmute = (value: string) =>
  publishMutes(reject((t: string[]) => t[1] === value, user.get().mutes || []))
