<script lang="ts">
  import {ctx} from "@welshman/lib"
  import {repository} from "@welshman/app"
  import {getReplyFilters} from "@welshman/util"
  import {deriveEvents} from "@welshman/store"
  import Icon from "@lib/components/Icon.svelte"
  import Link from "@lib/components/Link.svelte"
  import Content from "@app/components/Content.svelte"
  import NoteCard from "@app/components/NoteCard.svelte"
  import {entityLink} from "@app/state"

  export let event
</script>

<div class="flex flex-col items-end">
  <NoteCard {event} class="card2 bg-alt w-full">
    <div class="ml-12">
      <Content {event} />
    </div>
  </NoteCard>
</div>
