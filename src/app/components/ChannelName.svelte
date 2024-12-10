<script lang="ts">
  import {GENERAL, channelsById, makeChannelId} from "@app/state"

  export let url
  export let room
</script>

{#if room === GENERAL}
  general
{:else}
  {$channelsById.get(makeChannelId(url, room))?.name || room}
{/if}
