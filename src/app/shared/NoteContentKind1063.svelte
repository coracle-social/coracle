<script lang="ts">
  import {Tags} from "paravel"
  import {urlIsMedia} from "src/util/notes"
  import NoteContentLink from "src/app/shared/NoteContentLink.svelte"

  export let note, showMedia

  const url = Tags.from(note).getValue("url")
</script>

{#if url}
  <NoteContentLink value={{url, isMedia: urlIsMedia(url)}} {showMedia} />
{/if}
