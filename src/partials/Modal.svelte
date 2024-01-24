<script lang="ts">
  import {randomId} from "hurdak"
  import {onMount} from "svelte"
  import {fly, fade} from "src/util/transition"
  import AlternatingBackground from "src/partials/AlternatingBackground.svelte"
  import {router} from "src/app/router"

  export let mini = false
  export let virtual = true
  export let onEscape = null
  export let canClose = true

  const {history} = router

  let root, content, closing, historyItem, isNested

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

    // If there's another modal in the list after this one, skip if it's not already closing
    const next = root.nextElementSibling
    if (next?.classList.contains("modal") && !next?.classList.contains("pointer-events-none")) {
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

    isNested = Boolean($history[1]?.config.modal)
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
              class:hidden={!isNested}
              class="clear-modals pointer-events-auto flex h-10 w-10 cursor-pointer items-center justify-center
                     rounded-full border border-solid border-cocoa bg-mid text-lightest transition-colors hover:bg-mid">
              <i class="fa fa-angles-down fa-lg" />
            </div>
          </div>
        {/if}
        <AlternatingBackground class="absolute mt-12 h-full w-full" />
        <div on:click|stopPropagation>
          <AlternatingBackground
            class="relative h-full w-full cursor-auto overflow-hidden rounded-t-2xl pb-10 pt-2">
            <div class="m-auto flex max-w-2xl flex-col gap-4 p-2">
              <slot />
            </div>
          </AlternatingBackground>
        </div>
      </div>
    </div>
  </div>
</slot>
