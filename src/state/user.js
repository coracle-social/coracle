import {writable, get} from "svelte/store"
import {getLocalJson, setLocalJson} from "src/util/misc"
import {nostr} from 'src/state/nostr'

export const user = writable(getLocalJson("coracle/user"))

user.subscribe($user => {
  setLocalJson("coracle/user", $user)

  // Keep nostr in sync
  nostr.login($user?.privkey)
})

user.refresh = async () => {
  const $user = get(user)

  if ($user) {
    const data = await nostr.findLast({authors: [$user.pubkey], kinds: [0]})

    if (data) {
      user.update($user => ({...$user, ...JSON.parse(data.content)}))
    }

    return Boolean(data)
  }

  return false
}

// Check for new data every so often
setTimeout(() => user.refresh(), 60 * 1000)
