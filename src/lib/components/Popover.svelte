<script lang="ts">
  import type {Snippet} from "svelte"
  import {fly} from "@lib/transition"

  interface Props {
    onClose: any
    hideOnClick?: boolean
    children?: Snippet
  }

  const {onClose, hideOnClick = false, children}: Props = $props()

  const onMouseUp = (e: any) => {
    if (hideOnClick || !element?.contains(e.target)) {
      setTimeout(onClose)
    }
  }

  const onKeyDown = (e: any) => {
    if (e.key === "Escape") {
      setTimeout(onClose)
    }
  }

  let element: HTMLElement | undefined = $state()
</script>

<svelte:window onmouseup={onMouseUp} onkeydown={onKeyDown} />

<div class="relative w-full" bind:this={element}>
  <div transition:fly|local class="absolute z-popover w-full">
    {@render children?.()}
  </div>
</div>
