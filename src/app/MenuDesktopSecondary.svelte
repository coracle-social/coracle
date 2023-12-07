<script lang="ts">
  import {slide} from 'src/util/transition'

  export let onEscape
</script>

<svelte:body
  on:keydown={e => {
    if (e.key === "Escape") {
      onEscape()
    }
  }} />

<div class="fixed inset-0" on:click={onEscape} />

<div
  class="absolute bottom-20 left-0 w-60 bg-dark rounded-t-xl border border-solid border-mid"
  transition:slide|local={{y: 20, duration: 300}}
  on:click={onEscape}>
  <slot />
</div>
