<script lang="ts">
  import {getTagValue} from "@welshman/util"
  import NoteContentLink from "src/app/shared/NoteContentLink.svelte"

  export let note, showMedia

  const url = getTagValue("url", note.tags)
</script>

{#if url}
  <NoteContentLink {url} {showMedia} />
{/if}
