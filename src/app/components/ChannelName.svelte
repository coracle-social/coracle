<script lang="ts">
  import {GENERAL, channelsById, makeChannelId} from "@app/state"

  const {url, room} = $props()
</script>

{#if room === GENERAL}
  general
{:else}
  {$channelsById.get(makeChannelId(url, room))?.name || room}
{/if}
