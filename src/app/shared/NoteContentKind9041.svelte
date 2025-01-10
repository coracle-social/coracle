<script lang="ts">
  import type {TrustedEvent} from "@welshman/util"
  import NoteContentKind1 from "./NoteContentKind1.svelte"
  import {fromPairs} from "@welshman/lib"
  import {formatTimestamp} from "src/util/misc"

  export let note: TrustedEvent

  const {closed_at, amount} = fromPairs(note.tags)
</script>

<div>
  Raising <strong class="text-accent">{amount} Sats</strong> by {formatTimestamp(Number(closed_at))}
</div>
{#if note.content}
  <div class="mt-2 flex space-x-2">
    <span>Goal:</span>
    <NoteContentKind1 {note} />
  </div>
{/if}
