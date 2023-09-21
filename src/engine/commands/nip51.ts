import {reject} from "ramda"
import {now} from "src/util/misc"
import {people} from "src/engine/state"
import {user, canSign, stateKey} from "src/engine/queries"
import {updateStore} from "src/engine/projections"
import {publishEvent} from "./util"

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

export const publishPersonList = (name, tags) => publishEvent(30000, {tags: [["d", name], ...tags]})

export const publishBookmarksList = (name, tags) =>
  publishEvent(30001, {tags: [["d", name], ...tags]})
