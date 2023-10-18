<script lang="ts">
  import {Tags} from "src/util/nostr"
  import Anchor from "src/partials/Anchor.svelte"
  import Chip from "src/partials/Chip.svelte"
  import {router} from "src/app/router"

  export let note
</script>

<div>
  {#each Tags.from(note).topics() as topic}
    <Anchor modal href={router.at("topics").of(topic).toString()}>
      <Chip class="mb-2 mr-2 inline-block cursor-pointer">#{topic}</Chip>
    </Anchor>
  {/each}
</div>
