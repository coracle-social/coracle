<script lang="ts">
  import cx from "classnames"
  import {onMount} from "svelte"
  import {fly} from "src/util/transition"

  export let onClose = null
  export let hideOnClick = false
  export let position = "bottom"
  export let absolute = false
  export let fixed = false

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

<svelte:window
  on:mouseup={e => {
    if (hideOnClick || !popover.contains(e.target)) {
      setTimeout(onClose)
    }
  }}
  on:keydown={e => {
    if (e.key === "Escape") {
      setTimeout(onClose)
    }
  }} />

<div class={cx($$props.class, {absolute, fixed})}>
  <div
    class="absolute left-0 right-0 top-0 z-popover"
    class:top-0={position === "bottom"}
    class:bottom-0={position === "top"}
    bind:this={popover}
    transition:fly|local={{y: 20, duration: 200}}>
    <slot />
  </div>
</div>
