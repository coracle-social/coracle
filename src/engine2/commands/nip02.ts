import {reject} from "ramda"
import {now} from "src/util/misc"
import {people} from "src/engine2/state"
import {user, canSign, stateKey} from "src/engine2/queries"
import {updateKey} from "src/engine2/projections"
import {publishEvent, mention} from "./util"

export const publishPetnames = async ($petnames: string[][]) => {
  if (canSign.get()) {
    publishEvent(3, {tags: $petnames})
  } else {
    updateKey(people.key(stateKey.get()), now(), {petnames: $petnames})
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
