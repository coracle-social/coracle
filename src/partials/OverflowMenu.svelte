<script lang="ts">
  import Anchor from "src/partials/Anchor.svelte"
  import Popover from "src/partials/Popover.svelte"

  export let actions
  export let size = ""
</script>

{#if actions.length > 0}
  {#if actions.length === 1}
    <Popover triggerType="mouseenter">
      <i
        slot="trigger"
        class={`fa fa-${actions[0].icon} cursor-pointer`}
        on:click={actions[0].onClick} />
      <p slot="tooltip">{actions[0].label}</p>
    </Popover>
  {:else}
    <Popover theme="transparent">
      <div slot="trigger" class="cursor-pointer px-2">
        <i class={`fa fa-${size} fa-ellipsis-v`} />
      </div>
      <div
        slot="tooltip"
        let:instance
        class="relative flex flex-col gap-2"
        on:click={() => instance.hide()}>
        <div
          class="absolute bottom-0 right-0 top-0 w-32 rounded-3xl bg-gray-8"
          style="filter: blur(15px)" />
        {#each actions as { label, icon, onClick }}
          <div class="relative z-10 cursor-pointer text-gray-2" on:click={onClick}>
            <span class="absolute right-0 mr-12 mt-2 whitespace-nowrap">{label}</span>
            <Anchor theme="button-circle"><i class={`fa fa-${icon}`} /></Anchor>
          </div>
        {/each}
      </div>
    </Popover>
  {/if}
{/if}
