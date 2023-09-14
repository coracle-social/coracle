<script lang="ts">
  import {seconds} from "hurdak"
  import Feed from "src/app/shared/Feed.svelte"

  export let pubkey
  export let relays

  const filter = {kinds: [7], authors: [pubkey]}
</script>

<Feed hideControls delta={seconds(12, "hour")} {relays} {filter} />
