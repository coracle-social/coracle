<script lang="ts">
  import NoteContentKind1 from "src/app/shared/NoteContentKind1.svelte"
  import NoteContentKind40 from "src/app/shared/NoteContentKind40.svelte"
  import NoteContentKind1985 from "src/app/shared/NoteContentKind1985.svelte"
  import NoteContentKind9802 from "src/app/shared/NoteContentKind9802.svelte"
  import NoteContentKind1063 from "src/app/shared/NoteContentKind1063.svelte"
  import NoteContentKind30023 from "src/app/shared/NoteContentKind30023.svelte"
  import {User} from "src/app/engine"

  export let note
  export let anchorId = null
  export let maxLength = 700
  export let showEntire = false
  export let expandable = true
  export let showMedia = User.getSetting("show_media")
</script>

{#if note.kind === 40}
  <NoteContentKind40 {note} />
{:else if note.kind === 1985}
  <NoteContentKind1985 {note} {anchorId} {maxLength} {showEntire} />
{:else if note.kind === 9802}
  <NoteContentKind9802 {note} {anchorId} {maxLength} {showEntire} {showMedia} />
{:else if note.kind === 1063}
  <NoteContentKind1063 {note} {showMedia} />
{:else if note.kind === 30023}
  <NoteContentKind30023 {note} {showEntire} {showMedia} />
{:else}
  <NoteContentKind1 {note} {anchorId} {maxLength} {showEntire} {showMedia} {expandable}>
    <div slot="note-content" let:quote>
      <svelte:self note={quote} {anchorId} {maxLength} />
    </div>
  </NoteContentKind1>
{/if}
