<script lang="ts">
  import {Tags} from "@coracle.social/util"
  import {urlIsMedia} from "src/util/notes"
  import NoteContentLink from "src/app/shared/NoteContentLink.svelte"

  export let note, showMedia

  const url = Tags.fromEvent(note).get("url").value()
</script>

{#if url}
  <NoteContentLink value={{url, isMedia: urlIsMedia(url)}} {showMedia} />
{/if}
