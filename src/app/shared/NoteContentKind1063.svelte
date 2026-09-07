<script lang="ts">
  import {tagSpec, tagValues} from "@welshman/util"
  import NoteContentLinks from "src/app/shared/NoteContentLinks.svelte"

  export let note, showMedia

  const urls = tagValues(tagSpec("url"), note.tags)
</script>

{#if urls.length > 0}
  <NoteContentLinks {urls} {showMedia} />
{/if}
