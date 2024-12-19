<script lang="ts">
  import {getRelayTagValues} from "@welshman/util"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import RelayCard from "src/app/shared/RelayCard.svelte"

  export let note
</script>

<FlexColumn small>
  <p>New relay selections:</p>
  {#each getRelayTagValues(note.tags) as url}
    <RelayCard {url} />
  {/each}
</FlexColumn>
