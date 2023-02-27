<script lang="ts">
  import Feed from "src/views/notes/Feed.svelte"
  import {sampleRelays, getPubkeyWriteRelays} from 'src/agent/relays'

  export let pubkey

  const relays = sampleRelays(getPubkeyWriteRelays(pubkey))
  const filter = {kinds: [1], authors: [pubkey]}
</script>

<Feed {relays} {filter} parentsTimeout={3000} />
