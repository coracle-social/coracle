<script lang="ts">
  import {Tags} from "src/util/nostr"
  import {canDisplayUrl} from "src/util/notes"
  import NoteContentLink from "src/app/shared/NoteContentLink.svelte"

  export let note, showMedia

  const url = Tags.from(note).getMeta("url")
</script>

{#if url}
  <NoteContentLink value={{url, canDisplay: canDisplayUrl(url)}} {showMedia} />
{/if}
