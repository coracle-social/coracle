<script lang="ts">
  import NoteContentKind1 from "src/app/shared/NoteContentKind1.svelte"
  import NoteContentKind1985 from "src/app/shared/NoteContentKind1985.svelte"
  import NoteContentKind9802 from "src/app/shared/NoteContentKind9802.svelte"
  import NoteContentKind1063 from "src/app/shared/NoteContentKind1063.svelte"
  import user from "src/agent/user"

  export let note
  export let anchorId = null
  export let maxLength = 700
  export let showEntire = false
  export let showMedia = user.getSetting("showMedia")
</script>

{#if note.kind === 1985}
  <NoteContentKind1985 {note} {anchorId} {maxLength} {showEntire} />
{:else if note.kind === 9802}
  <NoteContentKind9802 {note} {anchorId} {maxLength} {showEntire} {showMedia} />
{:else if note.kind === 1063}
  <NoteContentKind1063 {note} {showMedia} />
{:else}
  <NoteContentKind1 {note} {anchorId} {maxLength} {showEntire} {showMedia} />
{/if}
