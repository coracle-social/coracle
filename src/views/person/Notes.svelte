<script lang="ts">
  import Notes from "src/partials/Notes.svelte"
  import {getPubkeyRelays} from 'src/agent/helpers'

  export let pubkey

  const relays = getPubkeyRelays(pubkey, 'write')
  const filter = {kinds: [1], authors: [pubkey]}
</script>


<Notes {relays} {filter} />
