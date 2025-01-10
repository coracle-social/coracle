<script lang="ts">
  import {getContentWarning} from "src/util/nostr"
  import Anchor from "src/partials/Anchor.svelte"
  import NoteContentKind0 from "src/app/shared/NoteContentKind0.svelte"
  import NoteContentKind1 from "src/app/shared/NoteContentKind1.svelte"
  import NoteContentKind40 from "src/app/shared/NoteContentKind40.svelte"
  import NoteContentKind1808 from "src/app/shared/NoteContentKind1808.svelte"
  import NoteContentKind1985 from "src/app/shared/NoteContentKind1985.svelte"
  import NoteContentKind1986 from "src/app/shared/NoteContentKind1986.svelte"
  import NoteContentKind9041 from "src/app/shared/NoteContentKind9041.svelte"
  import NoteContentKind9735 from "src/app/shared/NoteContentKind9735.svelte"
  import NoteContentKind9802 from "src/app/shared/NoteContentKind9802.svelte"
  import NoteContentKind1063 from "src/app/shared/NoteContentKind1063.svelte"
  import NoteContentKind30009 from "src/app/shared/NoteContentKind30009.svelte"
  import NoteContentKind30023 from "src/app/shared/NoteContentKind30023.svelte"
  import NoteContentKind30311 from "src/app/shared/NoteContentKind30311.svelte"
  import NoteContentKind30402 from "src/app/shared/NoteContentKind30402.svelte"
  import NoteContentKind31337 from "src/app/shared/NoteContentKind31337.svelte"
  import NoteContentKind31890 from "src/app/shared/NoteContentKind31890.svelte"
  import NoteContentKind31923 from "src/app/shared/NoteContentKind31923.svelte"
  import NoteContentKind32123 from "src/app/shared/NoteContentKind32123.svelte"
  import NoteContentKindList from "src/app/shared/NoteContentKindList.svelte"
  import NoteContentKindRelay from "src/app/shared/NoteContentKindRelay.svelte"
  import {getSetting, env} from "src/engine"
  import {CUSTOM_LIST_KINDS} from "src/domain"
  import NoteContentKind3 from "src/app/shared/NoteContentKind3.svelte"

  export let note
  export let depth = 0
  export let showEntire = false
  export let showMedia = getSetting("show_media")

  let warning = getSetting("hide_sensitive") ? getContentWarning(note) : null

  const ignoreWarning = () => {
    warning = null
  }
</script>

<div class:blur-sm={env.BLUR_CONTENT}>
  {#if warning}
    <div class="flex gap-2 text-neutral-300">
      <i class="fa fa-warning m-1" />
      <p>
        This note has been flagged by the author as "{warning}".<br />
        <Anchor underline on:click={ignoreWarning}>Show anyway</Anchor>
      </p>
    </div>
  {:else if note.kind === 0}
    <NoteContentKind0 {note} />
  {:else if note.kind === 3}
    <NoteContentKind3 {note} {showEntire} />
  {:else if [40, 41].includes(note.kind)}
    <NoteContentKind40 {note} />
  {:else if note.kind === 1808}
    <NoteContentKind1808 {note} {showEntire} />
  {:else if note.kind === 1985}
    <NoteContentKind1985 {note} {showEntire} />
  {:else if note.kind === 9735}
    <NoteContentKind9735 {note} {showEntire} {showMedia} />
  {:else if note.kind === 1986}
    <NoteContentKind1986 {note} {showEntire} />
  {:else if note.kind === 9802}
    <NoteContentKind9802 {note} {showEntire} {showMedia} />
  {:else if note.kind === 1063}
    <NoteContentKind1063 {note} {showMedia} />
  {:else if note.kind === 9041}
    <NoteContentKind9041 {note} />
  {:else if note.kind === 10002}
    <NoteContentKindRelay {note} kind={10002} />
  {:else if note.kind === 10006}
    <NoteContentKindRelay {note} kind={10006} />
  {:else if note.kind === 10007}
    <NoteContentKindRelay {note} kind={10007} />
  {:else if note.kind === 10050}
    <NoteContentKindRelay {note} kind={10050} />
  {:else if note.kind === 30009}
    <NoteContentKind30009 {note} {showMedia} />
  {:else if note.kind === 30023}
    <NoteContentKind30023 {note} {showEntire} {showMedia} />
  {:else if note.kind === 30311}
    <NoteContentKind30311 {note} {showMedia} />
  {:else if note.kind === 30402}
    <NoteContentKind30402 {note} {showEntire} {showMedia} />
  {:else if note.kind === 31337}
    <NoteContentKind31337 {note} {showMedia} />
  {:else if note.kind === 31890}
    <NoteContentKind31890 {note} />
  {:else if note.kind === 31923}
    <NoteContentKind31923 {note} />
  {:else if note.kind === 32123}
    <NoteContentKind32123 {note} />
  {:else if CUSTOM_LIST_KINDS.includes(note.kind)}
    <NoteContentKindList {note} />
  {:else}
    <NoteContentKind1 {note} {showEntire} {showMedia} {depth} expandable>
      <div slot="note-content" let:quote>
        <svelte:self depth={depth + 1} note={quote} />
      </div>
    </NoteContentKind1>
  {/if}
</div>
