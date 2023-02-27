<script lang="ts">
  import Feed from "src/views/notes/Feed.svelte"
  import {isLike} from 'src/util/nostr'
  import {sampleRelays, getPubkeyWriteRelays} from 'src/agent/relays'

  export let pubkey

  const relays = sampleRelays(getPubkeyWriteRelays(pubkey))
  const filter = {kinds: [7], authors: [pubkey]}
  const shouldDisplay = e => isLike(e.content)
</script>

<Feed {relays} {filter} {shouldDisplay} />

