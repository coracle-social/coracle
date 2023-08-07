<script lang="ts">
  import {isNil} from "ramda"
  import {getLabelQuality} from "src/util/nostr"
  import NoteContentLabel from "src/app/shared/NoteContentLabel.svelte"
  import NoteContentRating from "src/app/shared/NoteContentRating.svelte"
  import NoteContentKind1 from "src/app/shared/NoteContentKind1.svelte"

  export let note, anchorId, maxLength, showEntire

  const rating = getLabelQuality("review/relay", note)
</script>

<div class="flex flex-col gap-2 overflow-hidden text-ellipsis">
  {#if !isNil(rating)}
    <NoteContentRating {note} {rating} />
  {:else}
    <NoteContentLabel {note} />
  {/if}
  <NoteContentKind1 {note} {anchorId} {maxLength} {showEntire} />
</div>
