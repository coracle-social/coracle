<script lang="ts">
  import cx from "classnames"
  import {randomId} from "hurdak"
  import {onMount} from "svelte"
  import {fly, fade} from "src/util/transition"
  import AltColor from "src/partials/AltColor.svelte"
  import {router} from "src/app/util/router"

  export let mini = false
  export let virtual = true
  export let onEscape = null
  export let canClose = true
  export let canCloseAll = true

  const {history} = router

  let root, content, closing, historyItem, isNested

  const tryClose = () => {
    // Since we're popping, avoid double clicks
    if (!canClose || closing) {
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
    const key = randomId()

    // Make sure we can identify this modal by key
    // If we're virtual, add a new one, if not update the old one
    if (virtual) {
      router.virtual().open({key, mini})
    }

    historyItem = $history[0]
    isNested = Boolean($history[1]?.modal)

    // If history changes and removes this modal, notify the caller if virtual
    const unsub = history.subscribe($history => {
      if (!$history.includes(historyItem) && !closing) {
        onEscape?.()
      }
    })

    // When unmounting, sync history via pop if virtual
    return () => {
      unsub()
      tryPop()
      router.remove(key)
    }
  })
</script>

<svelte:body
  on:keydown={e => {
    if (e.key === "Escape") {
      tryClose?.()
    }
  }} />

<div bind:this={root} class={cx($$props.class, "modal group absolute")}>
  <slot name="wrapper">
    <div transition:fade class="fixed inset-0 z-modal" class:pointer-events-none={closing}>
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
                     border border-solid border-accent bg-accent text-white transition-colors hover:bg-accent"
                on:click={tryClose}>
                <i class="fa fa-times fa-lg cy-modal-close" />
              </div>
              <div
                on:click|stopPropagation={() => router.clearModals()}
                class:hidden={!isNested || !canCloseAll}
                class="clear-modals pointer-events-auto flex h-10 w-10 cursor-pointer items-center justify-center
                       rounded-full border border-solid border-tinted-700 bg-neutral-600 text-neutral-100 transition-colors hover:bg-neutral-600">
                <i class="fa fa-angles-down fa-lg" />
              </div>
            </div>
          {/if}
          <AltColor background class="absolute mt-12 h-full w-full" />
          <div on:click|stopPropagation>
            <AltColor
              background
              class="relative h-full w-full cursor-auto rounded-t-2xl pb-20 pt-2">
              <div class="modal-content-inner m-auto flex max-w-2xl flex-col gap-4 p-2">
                <slot />
              </div>
            </AltColor>
          </div>
        </div>
      </div>
    </div>
  </slot>
</div>
