import {reject} from "ramda"
import {now} from "src/util/misc"
import {people} from "src/engine/state"
import {user, canSign, stateKey} from "src/engine/queries"
import {updateStore} from "src/engine/projections"
import {publishEvent, mention} from "./util"

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
