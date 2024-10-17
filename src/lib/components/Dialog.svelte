<script lang="ts">
  import {noop} from '@welshman/lib'
  import {fade, fly} from "@lib/transition"

  export let onClose: any = noop
  export let fullscreen = false

  $: extraClass = !fullscreen && "card2 bg-alt max-h-[90vh] w-[90vw] overflow-auto text-base-content sm:w-[520px]"
</script>

<div class="center fixed inset-0 z-modal">
  <button
    class="absolute inset-0 cursor-pointer bg-black opacity-75"
    transition:fade={{duration: 300}}
    on:click={onClose} />
  <div class="relative scroll-container {extraClass}" transition:fly={{duration: 300}}>
    <slot />
  </div>
</div>
