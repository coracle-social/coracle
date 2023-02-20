<script>
  import {shuffle} from 'src/util/misc'
  import Notes from "src/partials/Notes.svelte"
  import {getUserFollows} from 'src/agent/social'
  import {getAllPubkeyWriteRelays} from 'src/agent/relays'

  const authors = shuffle(getUserFollows()).slice(0, 256)
  const relays = getAllPubkeyWriteRelays(authors)
  const filter = {kinds: [1, 7], authors}
</script>

<Notes {relays} {filter} />
