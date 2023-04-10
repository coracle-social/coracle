<script lang="ts">
  import Anchor from "src/partials/Anchor.svelte"
  import Popover from "src/partials/Popover.svelte"

  export let actions
  export let size = ""
</script>

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
      class="absolute top-0 right-0 bottom-0 w-32 rounded-full bg-gray-8"
      style="filter: blur(15px) opacity(0.75)" />

    {#each actions as { label, icon, onClick }}
      <div class="relative z-10 cursor-pointer" on:click={onClick}>
        <span class="absolute right-0 mr-12 mt-2">{label}</span>
        <Anchor type="button-circle"><i class={`fa fa-${icon}`} /></Anchor>
      </div>
    {/each}
  </div>
</Popover>
