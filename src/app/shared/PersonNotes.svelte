<script lang="ts">
  import {noteKinds} from "src/util/nostr"
  import Feed from "src/app/shared/Feed.svelte"

  export let pubkey
  export let relays

  const filter = {kinds: noteKinds, authors: [pubkey]}
</script>

<Feed {relays} {filter} invertColors />
