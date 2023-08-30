<script lang="ts">
  import {Tags} from "src/util/nostr"
  import Chip from "src/partials/Chip.svelte"

  export let note
  export let type = "l"

  const labels = Tags.from(note).type(type).values().all()
</script>

<div>
  {#each labels as label}
    <Chip class="mb-2 mr-2 inline-block"><i class="fa fa-tag" /> {label}</Chip>
  {/each}
</div>
