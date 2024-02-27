<script lang="ts">
  import {Tags} from "paravel"
  import {urlIsMedia} from "src/util/notes"
  import NoteContentKind1 from "src/app/shared/NoteContentKind1.svelte"
  import NoteContentLink from "src/app/shared/NoteContentLink.svelte"

  export let note, maxLength, showEntire, showMedia

  const ref = Tags.fromEvent(note).get("r")?.value()
</script>

<div class="flex flex-col gap-2 overflow-hidden text-ellipsis">
  <div class="border-l-2 border-solid border-neutral-600 pl-4">
    <NoteContentKind1 {note} {maxLength} {showEntire} />
  </div>
</div>

{#if ref}
  <NoteContentLink {showMedia} value={{url: ref, isMedia: urlIsMedia(ref)}} />
{/if}
