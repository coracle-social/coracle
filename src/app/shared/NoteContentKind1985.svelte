<script lang="ts">
  import {getLabelQuality} from "src/util/nostr"
  import NoteContentRating from "src/app/shared/NoteContentRating.svelte"
  import NoteContentKind1 from "src/app/shared/NoteContentKind1.svelte"

  export let note, anchorId, maxLength, showEntire

  const rating = getLabelQuality("review/relay", note)
</script>

<div class="flex flex-col gap-2 overflow-hidden text-ellipsis">
  {#if rating}
    <NoteContentRating {note} {rating} />
  {/if}
  <NoteContentKind1 {note} {anchorId} {maxLength} {showEntire} />
</div>
