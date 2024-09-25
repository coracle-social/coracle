<script lang="ts">
  import {fromPairs} from "@welshman/lib"
  import {urlIsMedia} from "@welshman/content"
  import NoteContentKind1 from "src/app/shared/NoteContentKind1.svelte"
  import NoteContentLink from "src/app/shared/NoteContentLink.svelte"

  export let note, showEntire, showMedia

  const meta: Record<string, string> = fromPairs(note.tags)
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
    <div class="text-end text-sm text-neutral-400 flex items-center gap-1">
      <i class="fa fa-highlighter fa-xs mt-1" />
      <NoteContentLink value={{url: meta.r, isMedia: urlIsMedia(meta.r)}} />
    </div>
  {/if}
</div>
