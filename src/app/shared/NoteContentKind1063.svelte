<script lang="ts">
  import {getTagValues} from "@welshman/util"
  import NoteContentLinks from "src/app/shared/NoteContentLinks.svelte"

  export let note, showMedia

  const urls = getTagValues("url", note.tags)
</script>

{#if urls.length > 0}
  <NoteContentLinks {urls} {showMedia} />
{/if}
