<script lang="ts">
  import type {TrustedEvent} from "@welshman/util"
  import {ensureNumber, formatTimestamp, fromPairs} from "@welshman/lib"
  import NoteContentKind1 from "src/app/shared/NoteContentKind1.svelte"

  export let note: TrustedEvent

  const {closed_at, amount} = fromPairs(note.tags)
</script>

<div>
  Raising <strong class="text-accent">{amount} Sats</strong>
  {#if closed_at}
    by {formatTimestamp(ensureNumber(closed_at))}
  {/if}
</div>
{#if note.content}
  <div class="mt-2 flex space-x-2">
    <span>Goal:</span>
    <NoteContentKind1 {note} />
  </div>
{/if}
