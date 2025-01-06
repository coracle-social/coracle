<script lang="ts">
  import {getRelayTagValues, isShareableRelayUrl} from "@welshman/util"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import RelayCard from "src/app/shared/RelayCard.svelte"

  export let note
</script>

<FlexColumn small>
  <p>New relay selections:</p>
  {#each getRelayTagValues(note.tags).filter(isShareableRelayUrl) as url}
    <RelayCard {url} />
  {/each}
</FlexColumn>
