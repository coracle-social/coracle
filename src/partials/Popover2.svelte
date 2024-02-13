<script lang="ts">
  import {onMount} from "svelte"
  import {fly} from "src/util/transition"

  let popover

  const removePadding = () => {
    for (const pad of Array.from(document.querySelectorAll(".popover-padding"))) {
      pad.remove()
    }
  }

  const adjustHeight = () => {
    const container = popover.closest("#page, .modal-content-inner")
    const {bottom: containerBottom} = container.getBoundingClientRect()
    const {bottom: popoverBottom} = popover.getBoundingClientRect()
    const diff = popoverBottom - containerBottom

    if (diff > 0) {
      const pad = document.createElement("div")

      pad.classList.add("popover-padding")
      pad.setAttribute("style", `height: ${diff + 20}px;`)

      container.appendChild(pad)
    }
  }

  onMount(() => {
    const interval = setInterval(adjustHeight, 300)

    return () => {
      clearInterval(interval)
      removePadding()
    }
  })
</script>

<div class="relative">
  <div
    class="absolute left-0 right-0 top-0 z-popover"
    bind:this={popover}
    transition:fly|local={{y: 20, duration: 200}}>
    <slot />
  </div>
</div>
