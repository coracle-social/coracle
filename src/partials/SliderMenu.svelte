<script lang="ts">
  import {fade, fly} from "src/util/transition"

  export let onEscape
  export let onClick
</script>

<svelte:body
  on:keydown={e => {
    if (e.key === "Escape") {
      onEscape()
    }
  }} />

<div transition:fade|local class="fixed inset-0 cursor-pointer bg-black opacity-75" on:click={onEscape} />
<div
  transition:fly|local={{y: 600, duration: 300}}
  class="fixed bottom-0 left-0 right-0 rounded-t-2xl border border-solid border-mid bg-dark pt-8"
  on:click={onClick}>
  <div class="staatliches flex flex-col gap-1 text-center text-lg">
    <slot />
  </div>
  <div class="flex h-16 cursor-pointer items-center justify-end p-3 text-white">
    <i class="fa fa-times fa-2x" on:click|stopPropagation={onEscape} />
  </div>
</div>
