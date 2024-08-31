<script lang="ts">
  import {append} from "@welshman/lib"
  import {pubkey, updateSession} from "@welshman/app"
  import {updateIn} from "src/util/misc"
  import {slide} from "src/util/transition"
  import Card from "src/partials/Card.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import {sessionWithMeta} from "src/engine"

  export let task

  const hideTask = () =>
    updateSession(
      pubkey.get(),
      updateIn("onboarding_tasks_completed", (tasks: string[]) => append(task, tasks)),
    )
</script>

{#if !$sessionWithMeta.onboarding_tasks_completed.includes(task)}
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
