<script lang="ts">
  import {Tags} from "src/util/nostr"
  import Chip from "src/partials/Chip.svelte"

  export let note

  const lTags = Tags.from(note).type("l").values().all()
</script>

<div>
  {#each lTags as label}
    <Chip class="mb-2 mr-2 inline-block"><i class="fa fa-tag" /> {label}</Chip>
  {/each}
</div>
