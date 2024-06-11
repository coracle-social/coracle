<script context="module" lang="ts">
  import {randomId} from "hurdak"
  import {writable} from "@welshman/lib"

  export const toast = writable(null)

  export const showToast = ({id = randomId(), type = "text", theme = "info", timeout = 5, ...opts}) => {
    toast.set({id, type, theme, ...opts})

    if (timeout) {
      setTimeout(() => {
        if (toast.get()?.id === id) {
          toast.set(null)
        }
      }, timeout * 1000)
    }
  }

  export const showInfo = (message, opts = {}) => showToast({message, ...opts})

  export const showWarning = (message, opts = {}) => showToast({message, theme: "warning", ...opts})

  export const showPublishInfo = (pub, opts = {}) => showToast({pub, type: "publish", ...opts})

  window.addEventListener('online', () => {
    if (toast.get()?.id === 'offline') {
      toast.set(null)
    }
  })

  window.addEventListener('offline', () => {
    showInfo("You are currently offline.", {id: 'offline', timeout: null})
  })
</script>

<script lang="ts">
  import cx from "classnames"
  import {fly} from "src/util/transition"
  import Anchor from 'src/partials/Anchor.svelte'

  let touchStart = 0
  let startOffset = 0
  let currentOffset = 0

  $: offset = currentOffset - startOffset

  const onTouchStart = e => {
    touchStart = Date.now()
    startOffset = e.touches[0].clientX
    currentOffset = e.touches[0].clientX
  }

  const onTouchMove = e => {
    currentOffset = e.touches[0].clientX
  }

  const onTouchEnd = e => {
    if (Math.abs(offset) > 200 || (Math.abs(offset) > 50 && Date.now() - touchStart < 300)) {
      currentOffset = 2 * (offset > 0 ? window.innerWidth : -window.innerWidth)

      setTimeout(() => {
        toast.set(null)
      }, 200)
    }

    setTimeout(() => {
      touchStart = 0
      startOffset = 0
      currentOffset = 0
    }, 200)
  }
</script>

{#if $toast}
  {#key "key"}
    <div
      on:touchstart={onTouchStart}
      on:touchmove={onTouchMove}
      on:touchend={onTouchEnd}
      class="pointer-events-none fixed left-0 right-0 top-0 z-toast flex justify-center"
      transition:fly={{y: -50, duration: 300}}>
      <div
        style={`transform: translate(${offset}px, 0)`}
        class={cx(
          "pointer-events-auto m-2 rounded border p-3 pr-8 text-center shadow-xl sm:ml-2",
          "relative max-w-xl flex-grow transition-all",
          {
            "border-neutral-600 bg-tinted-700 text-neutral-100": $toast.theme === "info",
            "border-warning bg-tinted-700 text-neutral-100": $toast.theme === "warning",
          },
        )}>
        {#if $toast.type === "text"}
          {$toast.message}
        {:else if $toast.type === "publish"}
          {@const {status, request} = $toast.pub}
          {@const total = request.relays.length}
          {@const pending = Array.from(status.values()).filter(s => s === "pending").length}
          Published to {total - pending}/{total} relays.
          <Anchor modal underline href="/publishes">View details</Anchor>
        {/if}
        <div class="absolute right-1 top-0 cursor-pointer p-3" on:click={() => toast.set(null)}>
          <i class="fa fa-times" />
        </div>
      </div>
    </div>
  {/key}
{/if}
