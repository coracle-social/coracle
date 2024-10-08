<script lang="ts">
  import {slide} from "@lib/transition"
  import Icon from "@lib/components/Icon.svelte"

  const toggle = () => {
    isOpen = !isOpen
  }

  let isOpen = false
</script>

<div class="relative flex flex-col gap-4 {$$props.class}">
  <button
    type="button"
    class="absolute right-8 top-8 h-4 w-4 cursor-pointer transition-all"
    class:rotate-90={!isOpen}
    on:click={toggle}>
    <Icon icon="alt-arrow-down" />
  </button>
  <slot name="title" />
  <slot name="description" />
  {#if isOpen}
    <div transition:slide>
      <slot />
    </div>
  {/if}
</div>
