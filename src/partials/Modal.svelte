<script>
  import {fly, fade} from "svelte/transition"

  export let onEscape = null

  let root
</script>

<svelte:body
  on:keydown={e => {
    if (e.key === 'Escape' && !root.querySelector('.modal')) {
      onEscape?.()
    }
  }} />

<div class="fixed inset-0 z-30 modal" bind:this={root}>
  <div
    class="absolute inset-0 bg-black opacity-75"
    class:cursor-pointer={onEscape}
    transition:fade
    on:click={onEscape} />
  <div
    class="absolute inset-0 mt-24 sm:mt-28 modal-content"
    transition:fly={{y: 1000, opacity: 1}}>
    <div class="bg-dark border-t border-solid border-medium h-full w-full overflow-auto pb-10">
      <slot />
    </div>
    {#if onEscape}
    <div class="absolute top-0 flex w-full justify-end pr-2 -mt-8 pointer-events-none">
      <div
        class="pointer-events-auto w-10 h-10 flex justify-center items-center bg-accent
               rounded-full cursor-pointer border border-solid border-medium border-b-0"
        on:click={onEscape}>
        <i class="fa fa-times fa-lg" />
      </div>
    </div>
    {/if}
  </div>
</div>
