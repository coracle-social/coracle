<script>
  import {fly, fade} from "svelte/transition"

  export let onEscape = null

  let root, content
</script>

<svelte:body
  on:keydown={e => {
    if (e.key === "Escape" && !root.querySelector(".modal")) {
      onEscape?.()
    }
  }} />

<div class="modal fixed inset-0 z-30 bg-black/75" bind:this={root} transition:fade>
  <div
    class="modal-content h-full overflow-auto"
    bind:this={content}
    transition:fly={{y: 1000}}
    class:cursor-pointer={onEscape}
    on:click={onEscape}>
    <div class="mt-12 min-h-full">
      {#if onEscape}
        <div class="pointer-events-none sticky top-0 z-10 flex w-full justify-end p-2">
          <div
            class="pointer-events-auto flex h-10 w-10 cursor-pointer items-center justify-center
                 rounded-full border border-solid border-medium bg-accent">
            <i class="fa fa-times fa-lg" />
          </div>
        </div>
      {/if}
      <div class="absolute mt-12 h-full w-full bg-dark" />
      <div
        class="relative h-full w-full cursor-auto border-t border-solid border-medium bg-dark pt-2 pb-10"
        on:click|stopPropagation>
        <slot />
      </div>
    </div>
  </div>
</div>
