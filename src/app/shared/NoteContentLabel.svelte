<script lang="ts">
  import {getTagValues} from "@welshman/util"
  import Chip from "src/partials/Chip.svelte"

  export let note
  export let type = "l"
</script>

<div>
  {#each getTagValues(type, note.tags) as label}
    <Chip class="mb-2 mr-2 inline-block"><i class="fa fa-tag" /> {label}</Chip>
  {/each}
</div>
