<script lang="ts">
  import {Tags} from "paravel"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import RelayCard from "src/app/shared/RelayCard.svelte"

  export let note

  const tags = Tags.from(note).type("r").all()
</script>

<FlexColumn small>
  <p>New relay selections:</p>
  {#each tags as [_, url, mode]}
    <RelayCard relay={{url}} />
  {/each}
</FlexColumn>
