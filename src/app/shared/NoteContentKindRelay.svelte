<script lang="ts">
  import {getRelayTagValues, isShareableRelayUrl} from "@welshman/util"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import RelayCard from "src/app/shared/RelayCard.svelte"

  export let note
  export let kind: 10002 | 10006 | 10007 | 10050 = 10002
</script>

<FlexColumn small>
  {#if kind === 10002}
    <p>New relay selections:</p>
  {:else if kind === 10006}
    <p>New blocked relay selections:</p>
  {:else if kind === 10007}
    <p>New searched relay selections:</p>
  {:else if kind === 10050}
    <p>New inbox relay selections:</p>
  {/if}
  {#each getRelayTagValues(note.tags).filter(isShareableRelayUrl) as url}
    <RelayCard {url} />
  {/each}
</FlexColumn>
