<script>
  import Notes from "src/partials/Notes.svelte"
  import {getUserRelays} from 'src/agent/helpers'

  const relays = getUserRelays('read')
  const filter = {kinds: [1, 5, 7]}
</script>

<Notes {relays} {filter} />
