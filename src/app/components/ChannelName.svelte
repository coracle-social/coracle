<script lang="ts">
  import {GENERAL, channelsById, makeChannelId} from "@app/state"

  let {url, room} = $props()
</script>

{#if room === GENERAL}
  general
{:else}
  {$channelsById.get(makeChannelId(url, room))?.name || room}
{/if}
