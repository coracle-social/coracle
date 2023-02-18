<script>
  import {shuffle} from 'src/util/misc'
  import Notes from "src/partials/Notes.svelte"
  import {getUserNetwork} from 'src/agent/social'
  import {getAllPubkeyWriteRelays} from 'src/agent/relays'

  // Get first- and second-order follows. shuffle and slice network so we're not
  // sending too many pubkeys. This will also result in some variety.
  const authors = shuffle(getUserNetwork()).slice(0, 256)
  const relays = getAllPubkeyWriteRelays(authors)
  const filter = {kinds: [1, 7], authors}
</script>

<Notes {relays} {filter} />
