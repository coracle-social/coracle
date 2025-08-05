<script lang="ts">
  import Button from "src/partials/Button.svelte"
  import Popover from "src/partials/Popover.svelte"

  export let actions
</script>

{#if actions.length > 0}
  {#if actions.length === 1}
    <Popover triggerType="mouseenter">
      <div slot="trigger" class="w-6 cursor-pointer text-center">
        <i class={`fa fa-${actions[0].icon} cursor-pointer`} on:click={actions[0].onClick} />
      </div>
      <p slot="tooltip">{actions[0].label}</p>
    </Popover>
  {:else}
    <Popover theme="transparent">
      <div
        slot="trigger"
        class="w-6 cursor-pointer rounded bg-neutral-800 text-center text-neutral-50 hover:bg-neutral-700">
        <i class="fa fa-sm fa-ellipsis-v" />
      </div>
      <div
        slot="tooltip"
        let:instance
        class="relative flex flex-col gap-2"
        on:click={() => instance.hide()}>
        <div
          class="absolute bottom-0 right-0 top-0 w-32 rounded-3xl bg-neutral-800"
          style="filter: blur(15px)" />
        {#each actions as { label, icon, onClick }}
          <Button
            class="relative z-popover flex cursor-pointer items-center text-neutral-100"
            on:click={onClick}>
            <span class="absolute right-0 mr-12 whitespace-nowrap">{label}</span>
            <span class="btn btn-tall btn-circle text-accent">
              <i class={`fa fa-${icon} text-sm`} />
            </span>
          </Button>
        {/each}
      </div>
    </Popover>
  {/if}
{/if}
