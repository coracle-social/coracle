<script lang="ts">
  import type {Placement} from "tippy.js"
  import "tippy.js/dist/tippy.css"
  import "tippy.js/animations/shift-away.css"
  import tippy from "tippy.js"
  import {onMount} from "svelte"

  export let theme = "dark"
  export let triggerType = "click"
  export let placement = "top"
  export let interactive = true
  export let arrow = false

  let trigger
  let tooltip
  let instance

  onMount(() => {
    instance = tippy(trigger, {
      theme,
      arrow,
      placement: placement as Placement,
      appendTo: () => document.body,
      allowHTML: true,
      interactive,
      trigger: triggerType,
      animation: "shift-away",
      onShow: () => {
        const [tooltipContents] = tooltip.children

        // If we've already triggered it, tooltipContents will be empty
        if (tooltipContents) {
          instance.popper.querySelector(".tippy-content").appendChild(tooltipContents)
          instance.popper.addEventListener("mouseleave", e => instance.hide())
          instance.popper.addEventListener("click", e => {
            if (e.target.closest(".tippy-close")) {
              instance.hide()
            }
          })
        }
      },
      onHidden: () => {
        const [tooltipContents] = instance.popper.querySelector(".tippy-content").children

        tooltip.appendChild(tooltipContents)
      },
    })

    return () => {
      instance.destroy()
    }
  })
</script>

<svelte:window
  on:scroll={e => {
    instance.hide()
  }} />

<svelte:body
  on:keydown={e => {
    if (e.key === "Escape") {
      instance.hide()
    }
  }} />

<div bind:this={trigger} class={$$props.class}>
  <slot name="trigger" />
</div>

<div bind:this={tooltip} class="hidden">
  <div>
    <slot name="tooltip" {instance} />
  </div>
</div>
