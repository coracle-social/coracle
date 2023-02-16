<script>
  import {uniq} from 'ramda'
  import Notes from "src/partials/Notes.svelte"
  import {user} from 'src/agent/user'
  import {getFollows, getNetwork} from 'src/agent/social'
  import {getAllPubkeyWriteRelays} from 'src/agent/relays'

  // Get first- and second-order follows. shuffle and slice network so we're not
  // sending too many pubkeys. This will also result in some variety.
  const follows = getFollows($user?.pubkey)
  const network = getNetwork($user?.pubkey)
  const authors = uniq(follows.concat(network)).slice(0, 100)
  const relays = getAllPubkeyWriteRelays(authors)
  const filter = {kinds: [1, 7], authors}
</script>

<Notes {relays} {filter} />
