<script lang="ts">
  import {slide} from '@lib/transition'
  import Icon from '@lib/components/Icon.svelte'

  const toggle = () => {
    isOpen = !isOpen
  }

  let isOpen = false
</script>

<div class="flex flex-col gap-4 relative {$$props.class}">
  <button
    type="button"
    class="absolute top-8 right-8 cursor-pointer w-4 h-4 transition-all"
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
