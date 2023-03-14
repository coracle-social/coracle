import {uniq, without} from "ramda"
import {Tags} from "src/util/nostr"
import {getPersonWithFallback} from "src/agent/tables"
import user from "src/agent/user"

export const getFollows = pubkey =>
  Tags.wrap(getPersonWithFallback(pubkey).petnames).type("p").values().all()

export const getNetwork = pubkey => {
  const follows = getFollows(pubkey)

  return uniq(without(follows, follows.flatMap(getFollows)))
}

export const getUserFollows = (): Array<string> => Tags.wrap(user.getPetnames()).values().all()

export const getUserNetwork = () => {
  const follows = getUserFollows()

  return uniq(without(follows, follows.flatMap(getFollows)))
}
