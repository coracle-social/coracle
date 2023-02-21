<script lang="ts">
  import Notes from "src/partials/Notes.svelte"
  import {sampleRelays, getPubkeyWriteRelays} from 'src/agent/relays'

  export let pubkey

  const relays = sampleRelays(getPubkeyWriteRelays(pubkey))
  const filter = {kinds: [7], authors: [pubkey]}
</script>

<Notes {relays} {filter} />

