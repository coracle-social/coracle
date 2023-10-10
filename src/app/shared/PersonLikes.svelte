<script lang="ts">
  import Feed from "src/app/shared/Feed.svelte"

  export let pubkey
</script>

<Feed hideControls filter={{kinds: [7], authors: [pubkey]}} />
