<script>
  import {fly, fade} from "svelte/transition"

  export let onEscape
  export let nested = false

  let root
</script>

<svelte:body
  on:keydown={e => {
    if (e.key === 'Escape' && !root.querySelector('.modal')) {
      onEscape()
    }
  }} />

<div class="fixed inset-0 z-10 modal" bind:this={root}>
  <button
    class="absolute inset-0 bg-black cursor-pointer"
    class:opacity-75={!nested}
    class:opacity-25={nested}
    transition:fade
    on:click={onEscape} />
  <div
    class="absolute inset-0 mt-20 sm:mt-28 modal-content"
    transition:fly={{y: 1000, opacity: 1}}
    style={nested && `padding-top: 1rem`}>
    <dialog open class="bg-dark border-t border-solid border-medium h-full w-full overflow-auto">
      <slot />
    </dialog>
  </div>
</div>
