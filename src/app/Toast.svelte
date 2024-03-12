<script lang="ts">
  import cx from "classnames"
  import {is} from "ramda"
  import {fly} from "src/util/transition"
  import {toast} from "src/partials/state"

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
            "border-neutral-600 bg-tinted-700 text-neutral-100": $toast.type === "info",
            "border-warning bg-tinted-700 text-neutral-100": $toast.type === "warning",
          },
        )}>
        {#if is(String, $toast.message)}
          {$toast.message}
        {:else}
          <div>
            {$toast.message.text}
            {#if $toast.message.link}
              <a
                class="ml-1 cursor-pointer underline"
                href={$toast.message.link.href}
                on:click={$toast.message.link.onClick}>
                {$toast.message.link.text}
              </a>
            {/if}
          </div>
        {/if}
        <div class="absolute right-1 top-0 cursor-pointer p-3" on:click={() => toast.set(null)}>
          <i class="fa fa-times" />
        </div>
      </div>
    </div>
  {/key}
{/if}
