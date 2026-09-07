<script lang="ts">
  import {append} from "@welshman/lib"
  import {slide} from "src/util/transition"
  import Card from "src/partials/Card.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import {pubkey, sessions} from "src/engine/core"
  import {sessionWithMeta} from "src/engine"
  import type {SessionWithMeta} from "src/engine"

  export let task

  // Onboarding progress is coracle's own per-account metadata, so it rides alongside welshman's
  // serializable session in the sessions store rather than inside it.
  const hideTask = () => {
    const userPubkey = pubkey.get()

    if (!userPubkey) return

    sessions.update($sessions => {
      const stored = $sessions[userPubkey] as SessionWithMeta

      if (!stored) return $sessions

      const updated: SessionWithMeta = {
        ...stored,
        onboarding_tasks_completed: append(task, stored.onboarding_tasks_completed || []),
      }

      return {...$sessions, [userPubkey]: updated}
    })
  }
</script>

{#if !$sessionWithMeta?.onboarding_tasks_completed?.includes(task)}
  <div class="-my-2">
    <div out:slide|local class="py-4">
      <Card class="relative">
        <FlexColumn>
          <slot />
        </FlexColumn>
        <i class="fa fa-times absolute right-0 top-0 cursor-pointer p-2" on:click={hideTask} />
      </Card>
    </div>
  </div>
{/if}
