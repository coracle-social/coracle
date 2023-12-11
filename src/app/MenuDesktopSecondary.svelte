<script lang="ts">
  import {slide} from "src/util/transition"

  export let onEscape
</script>

<svelte:body
  on:keydown={e => {
    if (e.key === "Escape") {
      onEscape()
    }
  }} />

<div class="fixed inset-0 cursor-pointer" on:click={onEscape} />

<div
  style="bottom: 4.5rem"
  class="absolute left-0 w-60 pr-px"
  transition:slide|local={{duration: 300}}
  on:click={onEscape}>
  <div class="bg-dark overflow-hidden rounded-t-xl">
    <slot />
  </div>
</div>
