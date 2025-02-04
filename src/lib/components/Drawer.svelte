<script lang="ts">
  import {fade, translate} from "@lib/transition"

  const {onClose, children} = $props()
</script>

<div class="drawer fixed inset-0 z-modal">
  <button
    aria-label="Close drawer"
    class="absolute inset-0 cursor-pointer bg-black opacity-50"
    transition:fade
    onclick={onClose}>
  </button>
  <div
    class="scroll-container saiy sair absolute bottom-0 right-0 top-0 w-80 overflow-auto bg-base-200 text-base-content lg:w-96"
    transition:translate={{axis: "x", duration: 300}}>
    {@render children?.()}
  </div>
</div>
