<script lang="ts">
  import {fromPairs} from "@welshman/lib"
  import type {TrustedEvent} from "@welshman/util"
  import NoteContentLink from "src/app/shared/NoteContentLink.svelte"

  export let note: TrustedEvent
  export let showMedia: boolean

  const {name, description, image} = fromPairs(note.tags)
</script>

<div class="flex flex-col gap-2 overflow-hidden text-ellipsis">
  <p>Created a badge:</p>
  <h3 class="staatliches text-2xl">{name}</h3>
  {#if description}
    <p>{description}</p>
  {/if}
  {#if image}
    <NoteContentLink {showMedia} url={image} />
  {/if}
</div>
