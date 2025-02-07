<script lang="ts">
  import {getTagValue} from "@welshman/util"
  import Media from "src/partials/Media.svelte"
  import NoteContentLabel from "src/app/shared/NoteContentLabel.svelte"
  import NoteContentKind1 from "src/app/shared/NoteContentKind1.svelte"

  export let note, showEntire

  const url = getTagValue('stream_url', note.tags)
</script>

<div class="flex flex-col gap-2 overflow-hidden text-ellipsis">
  <NoteContentKind1 {note} {showEntire} />
  {#if url}
    <Media url={url} />
  {/if}
  <NoteContentLabel type="t" {note} />
</div>
