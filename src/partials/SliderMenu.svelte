<script lang="ts">
  import Modal from "src/partials/Modal.svelte"
  import {fade, fly} from "src/util/transition"

  export let onEscape
  export let onClick
</script>

<Modal {onEscape}>
  <div slot="wrapper">
    <div
      transition:fade|local
      class="fixed inset-0 cursor-pointer bg-black opacity-75 z-modal"
      on:click={onEscape} />
    <div
      transition:fly|local={{y: 600, duration: 300}}
      class="fixed bottom-0 left-0 right-0 rounded-t-2xl border border-solid border-mid bg-dark pt-8 z-modal"
      on:click={onClick}>
      <div class="flex flex-col justify-center gap-1 text-lg">
        <slot />
      </div>
      <div class="flex h-16 cursor-pointer items-center justify-end p-3 text-warm">
        <i class="fa fa-times fa-2x" on:click|stopPropagation={onEscape} />
      </div>
    </div>
  </div>
</Modal>
