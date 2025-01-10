<script lang="ts">
  import {getRelayTagValues, isShareableRelayUrl} from "@welshman/util"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import RelayCard from "src/app/shared/RelayCard.svelte"
  import {RELAYS, BLOCKED_RELAYS, SEARCH_RELAYS, INBOX_RELAYS} from "@welshman/util"

  export let note
  export let kind: 10002 | 10006 | 10007 | 10050 = RELAYS
</script>

<FlexColumn small>
  {#if kind === RELAYS}
    <p>New relay selections:</p>
  {:else if kind === BLOCKED_RELAYS}
    <p>New blocked relay selections:</p>
  {:else if kind === SEARCH_RELAYS}
    <p>New searched relay selections:</p>
  {:else if kind === INBOX_RELAYS}
    <p>New inbox relay selections:</p>
  {/if}
  {#each getRelayTagValues(note.tags).filter(isShareableRelayUrl) as url}
    <RelayCard {url} />
  {/each}
</FlexColumn>
