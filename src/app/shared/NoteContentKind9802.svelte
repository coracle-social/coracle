<script lang="ts">
  import {fromPairs} from "@welshman/lib"
  import type {TrustedEvent} from "@welshman/util"
  import {urlIsMedia} from "@welshman/content"
  import NoteContentKind1 from "src/app/shared/NoteContentKind1.svelte"
  import NoteContentLinks from "src/app/shared/NoteContentLinks.svelte"

  export let note: TrustedEvent
  export let showEntire: boolean
  export let showMedia: boolean

  const meta = fromPairs(note.tags)
</script>

<div class="flex flex-col gap-2">
  {#if meta.comment}
    <NoteContentKind1 note={{content: meta.comment}} {showMedia} {showEntire} />
  {/if}
  <div class="flex flex-col gap-2 overflow-hidden text-ellipsis">
    <div class="border-l-2 border-solid border-neutral-600 pl-4">
      <NoteContentKind1 {note} {showEntire} />
    </div>
  </div>
  {#if meta.r}
    <div class="flex items-center gap-1 text-end text-sm text-neutral-400">
      <i class="fa fa-highlighter fa-xs mt-1" />
      <NoteContentLinks urls={[meta.r]} />
    </div>
  {/if}
</div>
