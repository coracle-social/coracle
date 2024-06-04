<script lang="ts">
  import {Tags} from "@welshman/util"
  import {urlIsMedia} from "@welshman/content"
  import NoteContentKind1 from "src/app/shared/NoteContentKind1.svelte"
  import NoteContentLink from "src/app/shared/NoteContentLink.svelte"

  export let note, showEntire, showMedia

  const ref = Tags.fromEvent(note).get("r")?.value()
</script>

<div class="flex flex-col gap-2 overflow-hidden text-ellipsis">
  <div class="border-l-2 border-solid border-neutral-600 pl-4">
    <NoteContentKind1 {note} {showEntire} />
  </div>
</div>

{#if ref}
  <NoteContentLink {showMedia} value={{url: ref, isMedia: urlIsMedia(ref)}} />
{/if}
