<script lang="ts">
  import {noop} from "@welshman/lib"
  import {fade, fly} from "@lib/transition"

  interface Props {
    onClose?: any
    fullscreen?: boolean
    children?: import("svelte").Snippet
  }

  const {onClose = noop, fullscreen = false, children}: Props = $props()

  const extraClass = $derived(
    !fullscreen &&
      "card2 bg-alt max-h-[90vh] w-[90vw] overflow-auto text-base-content sm:w-[520px] shadow-xl",
  )
</script>

<div class="center fixed inset-0 z-modal">
  <button
    aria-label="Close dialog"
    class="absolute inset-0 cursor-pointer bg-black opacity-75"
    transition:fade={{duration: 300}}
    onclick={onClose}>
  </button>
  <div class="scroll-container relative {extraClass}" transition:fly={{duration: 300}}>
    {@render children?.()}
  </div>
</div>
