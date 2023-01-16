<script>
  import {fly, fade} from "svelte/transition"

  export let onEscape
</script>

<svelte:body
  on:keydown={e => {
    if (e.key === 'Escape') {
      onEscape()
    }
  }} />

<div class="fixed inset-0 z-10">
  <div
    class="absolute inset-0 opacity-75 bg-black cursor-pointer"
    transition:fade
    on:click={onEscape} />
  <div class="absolute inset-0 mt-20 sm:mt-28 modal-content" transition:fly={{y: 1000, opacity: 1}}>
    <dialog open class="bg-dark border-t border-solid border-medium h-full w-full overflow-auto">
      <slot />
    </dialog>
  </div>
</div>
