import {uniq, without} from "ramda"
import {Tags} from "src/util/nostr"
import {getPersonWithFallback} from "src/agent/db"
import user from "src/agent/user"

export const defaultFollows = [
  "97c70a44366a6535c145b333f973ea86dfdc2d7a99da618c40c64705ad98e322", // hodlbod
  "3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d", // fiatjaf
  "82341f882b6eabcd2ba7f1ef90aad961cf074af15b9ef44a09f9d2a8fbfbe6a2", // jack
  "6e468422dfb74a5738702a8823b9b28168abab8655faacb6853cd0ee15deee93", // Gigi
]

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
