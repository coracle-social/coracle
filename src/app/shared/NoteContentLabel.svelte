<script lang="ts">
  import {Tags} from "@welshman/util"
  import Chip from "src/partials/Chip.svelte"

  export let note
  export let type = "l"

  const labels = Tags.fromEvent(note).values(type).valueOf()
</script>

<div>
  {#each labels as label}
    <Chip class="mb-2 mr-2 inline-block"><i class="fa fa-tag" /> {label}</Chip>
  {/each}
</div>
