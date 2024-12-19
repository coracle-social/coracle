<script lang="ts">
  import {getTagValue} from "@welshman/util"
  import {urlIsMedia} from "@welshman/content"
  import NoteContentLink from "src/app/shared/NoteContentLink.svelte"

  export let note, showMedia

  const url = getTagValue("url", note.tags)
</script>

{#if url}
  <NoteContentLink value={{url, isMedia: urlIsMedia(url)}} {showMedia} />
{/if}
