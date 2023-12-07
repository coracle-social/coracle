<script lang="ts">
  import {fade, fly} from 'src/util/transition'

  export let onEscape
  export let onClick
</script>

<svelte:body
  on:keydown={e => {
    if (e.key === "Escape") {
      onEscape()
    }
  }} />

<div transition:fade class="sm:hidden fixed inset-0 bg-black opacity-75 cursor-pointer" on:click={onEscape} />
<div transition:fly={{y: 600, duration: 300}} class="sm:hidden fixed bottom-0 left-0 right-0 rounded-t-2xl border border-solid border-mid bg-dark pt-8" on:click={onClick}>
  <div class="text-center staatliches text-lg flex flex-col gap-1">
    <slot />
  </div>
  <div class="h-16 flex justify-end items-center text-white p-3 cursor-pointer">
    <i class="fa fa-times fa-2x" on:click|stopPropagation={onEscape} />
  </div>
</div>
