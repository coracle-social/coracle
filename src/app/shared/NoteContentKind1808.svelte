<script lang="ts">
  import {fromPairs} from "ramda"
  import Media from "src/partials/Media.svelte"
  import NoteContentLabel from "src/app/shared/NoteContentLabel.svelte"
  import NoteContentKind1 from "src/app/shared/NoteContentKind1.svelte"

  export let note, maxLength, showEntire

  const {stream_url} = fromPairs(note.tags)
</script>

<div class="flex flex-col gap-2 overflow-hidden text-ellipsis">
  <NoteContentKind1 {note} {maxLength} {showEntire} />
  {#if stream_url}
    <Media url={stream_url} />
  {/if}
  <NoteContentLabel type="t" {note} />
</div>
