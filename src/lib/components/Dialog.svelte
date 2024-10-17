<script lang="ts">
  import {noop} from '@welshman/lib'
  import {fade, fly} from "@lib/transition"

  export let onClose: any = noop
</script>

<div class="center fixed inset-0 z-modal">
  <button
    class="absolute inset-0 cursor-pointer bg-black opacity-50"
    transition:fade
    on:click={onClose} />
  <div
    class="relative card2 bg-alt absolute max-h-[90vh] w-[90vw] overflow-auto text-base-content sm:w-[520px]"
    transition:fly={{duration: 300}}>
    <slot />
  </div>
</div>
