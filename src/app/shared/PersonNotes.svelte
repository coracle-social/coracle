<script lang="ts">
  import {noteKinds} from "src/util/nostr"
  import Feed from "src/app/shared/Feed.svelte"
  import {sessions} from "src/engine"

  export let pubkey
  export let relays

  const filter = {kinds: noteKinds, authors: [pubkey]}
</script>

<Feed invertColors queryCache={Boolean($sessions[pubkey])} {relays} {filter} />
