<script lang="ts">
  import {Tags} from "@welshman/util"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import RelayCard from "src/app/shared/RelayCard.svelte"

  export let note

  const urls = Tags.fromEvent(note).values("r").valueOf()
</script>

<FlexColumn small>
  <p>New relay selections:</p>
  {#each urls as url}
    <RelayCard {url} />
  {/each}
</FlexColumn>
