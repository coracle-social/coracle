<script lang="ts">
  import {fly} from "@lib/transition"

  export let onClose
  export let hideOnClick = false

  const onMouseUp = (e: any) => {
    if (hideOnClick || !element.contains(e.target)) {
      setTimeout(onClose)
    }
  }

  const onKeyDown = (e: any) => {
    if (e.key === "Escape") {
      setTimeout(onClose)
    }
  }

  let element: HTMLElement
</script>

<svelte:window on:mouseup={onMouseUp} on:keydown={onKeyDown} />

<div class="relative w-full" bind:this={element}>
  <div transition:fly|local class="absolute z-popover w-full">
    <slot />
  </div>
</div>
