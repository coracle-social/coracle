<script>
  import {fly, fade} from "svelte/transition"

  export let onEscape = null

  let root, content
</script>

<svelte:body
  on:keydown={e => {
    if (e.key === 'Escape' && !root.querySelector('.modal')) {
      onEscape?.()
    }
  }} />

<div class="fixed inset-0 z-30 modal bg-black/75" bind:this={root} transition:fade>
  <div
    class="modal-content overflow-auto h-full"
    bind:this={content}
    transition:fly={{y: 1000}}
    class:cursor-pointer={onEscape}
    on:click={onEscape}>
    <div class="mt-12 min-h-full">
      <div class="absolute w-full h-full bg-dark mt-12" />
      {#if onEscape}
      <div class="flex w-full justify-end p-2 sticky top-0 z-10 pointer-events-none">
        <div
          class="w-10 h-10 flex justify-center items-center bg-accent pointer-events-auto
                 rounded-full cursor-pointer border border-solid border-medium">
          <i class="fa fa-times fa-lg" />
        </div>
      </div>
      {/if}
      <div
        class="bg-dark border-t border-solid border-medium h-full w-full pb-10 cursor-auto"
        on:click|stopPropagation>
        <slot />
      </div>
    </div>
  </div>
</div>
