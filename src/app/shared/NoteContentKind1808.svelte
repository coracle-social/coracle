<script lang="ts">
  import {Tags} from "src/util/nostr"
  import {annotateMedia} from "src/util/misc"
  import Media from "src/partials/Media.svelte"
  import NoteContentLabel from "src/app/shared/NoteContentLabel.svelte"
  import NoteContentKind1 from "src/app/shared/NoteContentKind1.svelte"

  export let note, anchorId, maxLength, showEntire

  const {stream_url} = Tags.from(note).asMeta() as {stream_url: string}
</script>

<div class="flex flex-col gap-2 overflow-hidden text-ellipsis">
  <NoteContentKind1 {note} {anchorId} {maxLength} {showEntire} />
  <Media link={annotateMedia(stream_url)} />
  <NoteContentLabel type="t" {note} />
</div>
