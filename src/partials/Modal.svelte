<script lang="ts">
  import {randomId} from "hurdak"
  import {onMount, onDestroy} from "svelte"
  import {fly, fade} from "src/util/transition"
  import {modal} from "src/partials/state"

  export let mini = false
  export let index = null
  export let virtual = true
  export let isOnTop = true
  export let onEscape = null

  let root, content

  const id = randomId()
  const {stack} = modal

  const escapeIfOnTop = () => {
    if (virtual || isOnTop) {
      onEscape?.()
    }
  }

  onMount(() => {
    if (virtual) {
      modal.push({type: "virtual", id, mini, virtual: true})
    }
  })

  onDestroy(() => {
    if (virtual) {
      modal.remove(id)
    }
  })
</script>

<svelte:body
  on:keydown={e => {
    if (e.key === "Escape" && !root.querySelector(".modal")) {
      escapeIfOnTop?.()
    }
  }} />

<div bind:this={root} transition:fade class="modal fixed inset-0 z-30">
  <div
    class="fixed inset-0 cursor-pointer bg-black opacity-50"
    on:click|stopPropagation={escapeIfOnTop} />
  <div
    class="modal-content h-full overflow-auto"
    class:overflow-hidden={mini}
    class:pointer-events-none={mini}
    class:cursor-pointer={escapeIfOnTop}
    transition:fly={{y: 1000}}
    bind:this={content}
    on:click={escapeIfOnTop}>
    <div
      class="pointer-events-auto mt-12 min-h-full transition transition-all duration-500"
      style={mini ? "margin-top: 55vh" : ""}>
      {#if onEscape}
        <div class="pointer-events-none sticky top-0 z-20 flex w-full flex-col items-end gap-2 p-2">
          <div
            class="pointer-events-auto flex h-10 w-10 cursor-pointer items-center justify-center rounded-full
                 border border-solid border-accent-light bg-accent text-white transition-colors hover:bg-accent-light">
            <i class="fa fa-times fa-lg" />
          </div>
          {#if $stack.length > 1 && index > 0}
            <div
              on:click|stopPropagation={() => modal.clear()}
              class="pointer-events-auto flex h-10 w-10 cursor-pointer items-center justify-center rounded-full
                   border border-solid border-gray-7 bg-gray-6 text-gray-1 transition-colors hover:bg-gray-5">
              <i class="fa fa-angles-down fa-lg" />
            </div>
          {/if}
        </div>
      {/if}
      <div class="absolute mt-12 h-full w-full bg-gray-7" />
      <div
        class="relative h-full w-full cursor-auto border-t border-solid border-gray-6 bg-gray-7 pb-10 pt-2"
        on:click|stopPropagation>
        <slot />
      </div>
    </div>
  </div>
</div>
