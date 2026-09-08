<script lang="ts">
  import type {TrustedEvent} from "@welshman/util"
  import {formatTimestamp} from "@welshman/lib"
  import {ZapGoal} from "@welshman/domain"
  import NoteContentKind1 from "src/app/shared/NoteContentKind1.svelte"
  import {reader} from "src/engine/core"

  export let note: TrustedEvent

  const goal = reader(ZapGoal)(note)
  const closedAt = goal.closedAt()
</script>

<div>
  Raising <strong class="text-accent">{goal.amount()} Sats</strong>
  {#if closedAt}
    by {formatTimestamp(closedAt)}
  {/if}
</div>
{#if note.content}
  <div class="mt-2 flex space-x-2">
    <span>Goal:</span>
    <NoteContentKind1 {note} />
  </div>
{/if}
