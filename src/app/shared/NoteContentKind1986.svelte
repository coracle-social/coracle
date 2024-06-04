<script lang="ts">
  import {getRating} from "src/util/nostr"
  import NoteContentRating from "src/app/shared/NoteContentRating.svelte"
  import NoteContentKind1 from "src/app/shared/NoteContentKind1.svelte"

  export let note, showEntire

  const rating = getRating(note)
</script>

<div class="flex flex-col gap-2 overflow-hidden text-ellipsis">
  <NoteContentRating {note} {rating} />
  <NoteContentKind1 {note} {showEntire} />
</div>
