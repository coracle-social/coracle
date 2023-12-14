<script lang="ts">
  import {filter} from "ramda"
  import {randomId} from "hurdak"
  import {onMount} from "svelte"
  import {fly, fade} from "src/util/transition"
  import type {HistoryItem} from "src/util/router"
  import {router} from "src/app/router"

  export let mini = false
  export let index = null
  export let virtual = true
  export let isOnTop = true
  export let onEscape = null
  export let canClose = true

  let root, content, closing

  const modals = router.history.derived(filter((item: HistoryItem) => item.config.modal))
  const isNested = virtual ? $modals.length > 0 : $modals.length > 1 && index > 0

  const tryClose = () => {
    if (!canClose) {
      return
    }

    // Since we're popping, avoid double clicks
    if (closing) {
      return
    }

    // Don't close modals sitting down in the stack
    if (!virtual && !isOnTop) {
      return
    }

    // Don't cascade closing nested modals
    if (root?.querySelector(".modal")) {
      return
    }

    closing = true
    router.pop()
  }

  onMount(() => {
    if (virtual) {
      const id = randomId()

      router.virtual().open({id, mini})

      const unsub = modals.subscribe($modals => {
        if (!$modals.find(m => m.config.id === id)) {
          onEscape?.()
        }
      })

      return () => {
        unsub()

        router.remove(id)
      }
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
            {#if isNested}
              <div
                on:click|stopPropagation={() => router.clearModals()}
                class="pointer-events-auto flex h-10 w-10 cursor-pointer items-center justify-center rounded-full
                     border border-solid border-cocoa bg-mid text-lightest transition-colors hover:bg-mid">
                <i class="fa fa-angles-down fa-lg" />
              </div>
            {/if}
          </div>
        {/if}
        <div class="absolute mt-12 h-full w-full bg-swap" />
        <div
          class="relative h-full w-full cursor-auto overflow-hidden rounded-t-2xl bg-swap pb-10 pt-2"
          on:click|stopPropagation>
          <div class="m-auto flex max-w-2xl flex-col gap-4 p-2">
            <slot />
          </div>
        </div>
      </div>
    </div>
  </div>
</slot>
