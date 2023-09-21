<script lang="ts">
  import {getContentWarning} from "src/util/nostr"
  import Anchor from "src/partials/Anchor.svelte"
  import NoteContentKind0 from "src/app/shared/NoteContentKind0.svelte"
  import NoteContentKind1 from "src/app/shared/NoteContentKind1.svelte"
  import NoteContentKind3 from "src/app/shared/NoteContentKind3.svelte"
  import NoteContentKind40 from "src/app/shared/NoteContentKind40.svelte"
  import NoteContentKind1808 from "src/app/shared/NoteContentKind1808.svelte"
  import NoteContentKind1985 from "src/app/shared/NoteContentKind1985.svelte"
  import NoteContentKind9802 from "src/app/shared/NoteContentKind9802.svelte"
  import NoteContentKind1063 from "src/app/shared/NoteContentKind1063.svelte"
  import NoteContentKind10002 from "src/app/shared/NoteContentKind10002.svelte"
  import NoteContentKind30009 from "src/app/shared/NoteContentKind30009.svelte"
  import NoteContentKind30023 from "src/app/shared/NoteContentKind30023.svelte"
  import NoteContentKind31337 from "src/app/shared/NoteContentKind31337.svelte"
  import {getSetting} from "src/engine"

  export let note
  export let anchorId = null
  export let maxLength = 700
  export let showEntire = false
  export let expandable = true
  export let showMedia = getSetting("show_media")

  let warning = getSetting("hide_sensitive") ? getContentWarning(note) : null

  const ignoreWarning = () => {
    warning = null
  }
</script>

{#if warning}
  <div class="flex gap-2 text-gray-4">
    <i class="fa fa-warning m-1" />
    <p>
      This note has been flagged by the author as "{warning}".<br />
      <Anchor theme="anchor" on:click={ignoreWarning}>Show anyway</Anchor>
    </p>
  </div>
{:else if note.kind === 0}
  <NoteContentKind0 {note} />
{:else if note.kind === 3}
  <NoteContentKind3 {note} {showEntire} />
{:else if [40, 41].includes(note.kind)}
  <NoteContentKind40 {note} />
{:else if note.kind === 1808}
  <NoteContentKind1808 {note} {anchorId} {maxLength} {showEntire} />
{:else if note.kind === 1985}
  <NoteContentKind1985 {note} {anchorId} {maxLength} {showEntire} />
{:else if note.kind === 9802}
  <NoteContentKind9802 {note} {anchorId} {maxLength} {showEntire} {showMedia} />
{:else if note.kind === 1063}
  <NoteContentKind1063 {note} {showMedia} />
{:else if note.kind === 10002}
  <NoteContentKind10002 {note} />
{:else if note.kind === 30009}
  <NoteContentKind30009 {note} {showMedia} />
{:else if note.kind === 30023}
  <NoteContentKind30023 {note} {showEntire} {showMedia} />
{:else if note.kind === 31337}
  <NoteContentKind31337 {note} {showMedia} />
{:else}
  <NoteContentKind1 {note} {anchorId} {maxLength} {showEntire} {showMedia} {expandable}>
    <div slot="note-content" let:quote>
      <svelte:self note={quote} {anchorId} {maxLength} />
    </div>
  </NoteContentKind1>
{/if}
