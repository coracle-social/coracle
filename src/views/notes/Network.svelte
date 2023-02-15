<script>
  import {uniq} from 'ramda'
  import Notes from "src/partials/Notes.svelte"
  import {shuffle} from 'src/util/misc'
  import {Tags} from 'src/util/nostr'
  import {user, getTopRelays, getFollows} from 'src/agent/helpers'

  // Get first- and second-order follows. shuffle and slice network so we're not
  // sending too many pubkeys. This will also result in some variety.
  const follows = shuffle(Tags.wrap(getFollows($user?.pubkey)).values().all())
  const others = shuffle(Tags.wrap(follows.flatMap(getFollows)).values().all()).slice(0, 50)
  const authors = uniq(follows.concat(others)).slice(0, 100)
  const relays = getTopRelays(authors, 'write')
  const filter = {kinds: [1, 7], authors}
</script>

<Notes {relays} {filter} />
