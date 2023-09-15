import {nth} from "ramda"
import {people} from "src/engine2/state"
import {user} from "src/engine2/queries"

export const follows = user.derived($user => ($user?.petnames || []).map(nth(1)) as string[])

export const followsSet = follows.derived($follows => new Set($follows))

export const networkSet = followsSet.derived($follows => {
  const $network = new Set()

  for (const follow of $follows) {
    for (const [_, pubkey] of people.key(follow).get()?.petnames || []) {
      if (!$follows.has(pubkey)) {
        $network.add(pubkey)
      }
    }
  }

  return $network
})

export const network = networkSet.derived($networkSet => Array.from($networkSet) as string[])

export const isFollowing = (pubkey: string) => followsSet.derived(s => s.has(pubkey))
