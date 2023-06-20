<script lang="ts">
  import {Tags} from "src/util/nostr"
  import {urlIsMedia} from "src/util/notes"
  import NoteContentKind1 from "src/app/shared/NoteContentKind1.svelte"
  import NoteContentLink from "src/app/shared/NoteContentLink.svelte"

  export let note, anchorId, maxLength, showEntire, showMedia

  const ref = Tags.from(note).getMeta("r")
</script>

<div class="flex flex-col gap-2 overflow-hidden text-ellipsis">
  <div class="border-l-2 border-solid border-gray-5 pl-4">
    <NoteContentKind1 {note} {anchorId} {maxLength} {showEntire} />
  </div>
</div>

{#if ref}
  <NoteContentLink {showMedia} value={{url: ref, isMedia: urlIsMedia(ref)}} />
{/if}
