<script lang="ts">
  import {getTopicTagValues} from "@welshman/util"
  import Link from "src/partials/Link.svelte"
  import Chip from "src/partials/Chip.svelte"
  import {router} from "src/app/util/router"

  export let note
</script>

<div>
  {#each getTopicTagValues(note.tags) as topic}
    <Link modal href={router.at("topics").of(topic).toString()}>
      <Chip class="mb-2 mr-2 inline-block cursor-pointer">#{topic}</Chip>
    </Link>
  {/each}
</div>
