<script>
  import {uniq} from 'ramda'
  import Notes from "src/partials/Notes.svelte"
  import {shuffle} from 'src/util/misc'
  import {user, getTopRelays, getFollows} from 'src/agent/helpers'

  // Get first- and second-order follows. shuffle and slice network so we're not
  // sending too many pubkeys. This will also result in some variety.
  const follows = shuffle(getFollows($user?.pubkey))
  const others = shuffle(follows.flatMap(getFollows)).slice(0, 50)
  const authors = uniq(follows.concat(others)).slice(0, 100)
  const relays = getTopRelays(authors, 'write')
  const filter = {kinds: [1, 7], authors}
</script>

<Notes {relays} {filter} />
