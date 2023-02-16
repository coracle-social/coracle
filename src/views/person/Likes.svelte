<script>
  import Notes from "src/partials/Notes.svelte"
  import {getPubkeyWriteRelays} from 'src/agent/relays'

  export let pubkey

  const relays = getPubkeyWriteRelays(pubkey)
  const filter = {kinds: [7], authors: [pubkey]}
</script>

<Notes {relays} {filter} />

