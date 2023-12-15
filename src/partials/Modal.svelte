<script lang="ts">
  import {randomId} from "hurdak"
  import {onMount} from "svelte"
  import {fly, fade} from "src/util/transition"
  import {router} from "src/app/router"

  export let mini = false
  export let virtual = true
  export let onEscape = null
  export let canClose = true

  const {history} = router

  let root, content, closing, historyItem

  const tryClose = () => {
    if (!canClose) {
      return
    }

    // Since we're popping, avoid double clicks
    if (closing) {
      return
    }

    // Don't cascade closing nested modals
    if (root.querySelector(".modal")) {
      return
    }

    closing = true
    onEscape?.()
    tryPop()
  }

  const tryPop = () => {
    if ($history[0] === historyItem) {
      router.pop()
    }
  }

  onMount(() => {
    // Make sure we can identify this modal by key
    // If we're virtual, add a new one, if not update the old one
    if (virtual) {
      router.virtual().open({key: randomId(), mini})
    }

    historyItem = $history[0]

    // If history changes and removes this modal, notify the caller if virtual
    const unsub = history.subscribe($history => {
      if (!$history.includes(historyItem)) {
        onEscape?.()
      }
    })

    // When unmounting, sync history via pop if virtual
    return () => {
      unsub()
      tryPop()
    }
  })
</script>

<svelte:body
  on:keydown={e => {
    if (e.key === "Escape") {
      tryClose?.()
    }
  }} />

<slot name="wrapper">
  <div
    bind:this={root}
    transition:fade
    class="modal group fixed inset-0 z-modal"
    class:pointer-events-none={closing}>
    <div
      class="fixed inset-0 cursor-pointer bg-black opacity-50"
      on:click|stopPropagation={tryClose} />
    <div
      class="modal-content h-full overflow-auto"
      class:overflow-hidden={mini}
      class:pointer-events-none={mini}
      transition:fly={{y: 1000}}
      bind:this={content}>
      <div
        class="pointer-events-auto mt-12 min-h-full transition transition-all duration-500"
        class:mt-[55vh]={mini}>
        {#if canClose}
          <div
            class="pointer-events-none sticky top-0 z-popover flex w-full flex-col items-end gap-2 p-2">
            <div
              class="pointer-events-auto flex h-10 w-10 cursor-pointer items-center justify-center rounded-full
                   border border-solid border-accent-l bg-accent text-white transition-colors hover:bg-accent-l"
              on:click={tryClose}>
              <i class="fa fa-times fa-lg cy-modal-close" />
            </div>
            <div
              on:click|stopPropagation={() => router.clearModals()}
              class="clear-modals pointer-events-auto flex hidden h-10 w-10 cursor-pointer items-center justify-center
                     rounded-full border border-solid border-cocoa bg-mid text-lightest transition-colors hover:bg-mid">
              <i class="fa fa-angles-down fa-lg" />
            </div>
          </div>
        {/if}
        <div class="bg-swap absolute mt-12 h-full w-full" />
        <div
          class="bg-swap relative h-full w-full cursor-auto overflow-hidden rounded-t-2xl pb-10 pt-2"
          on:click|stopPropagation>
          <div class="m-auto flex max-w-2xl flex-col gap-4 p-2">
            <slot />
          </div>
        </div>
      </div>
    </div>
  </div>
</slot>
