<script lang="ts">
  import type {Placement} from "tippy.js"
  import "tippy.js/dist/tippy.css"
  import "tippy.js/animations/shift-away.css"
  import tippy from "tippy.js"
  import cx from 'classnames'
  import {onMount} from "svelte"
  import {isMobile} from "src/util/html"

  export let instance = null
  export let theme = "dark"
  export let triggerType = "click"
  export let placement: Placement = "top"
  export let interactive = true
  export let arrow = false
  export let opts = {} as {
    hideOnClick?: boolean
    maxWidth?: any
  }

  let trigger
  let tooltip

  $: adjustedTriggerType = isMobile ? "click" : triggerType

  onMount(() => {
    instance = tippy(trigger, {
      ...opts,
      theme,
      arrow,
      placement,
      appendTo: () => document.body,
      allowHTML: true,
      interactive,
      trigger: adjustedTriggerType,
      animation: "shift-away",
      onShow: () => {
        const [tooltipContents] = tooltip?.children || []

        // If we've already triggered it, tooltipContents will be empty
        if (tooltipContents instanceof Node) {
          instance.popper.querySelector(".tippy-content").appendChild(tooltipContents)

          instance.popper.addEventListener("mouseleave", e => {
            if (adjustedTriggerType !== "click") {
              instance.hide()
            }
          })

          instance.popper.addEventListener("click", e => {
            if (e.target.closest(".tippy-close") || opts.hideOnClick) {
              instance?.hide()
            }
          })
        }
      },
      onHidden: () => {
        const [tooltipContents] = instance.popper.querySelector(".tippy-content").children

        tooltip?.appendChild(tooltipContents)
      },
    })

    return () => {
      instance.destroy()
    }
  })
</script>

<svelte:window
  on:scroll={e => {
    instance?.hide()
  }}
  on:keydown={e => {
    if (e.key === "Escape") {
      instance?.hide()
    }
  }} />

<div bind:this={trigger} class={cx($$props.class, "cursor-pointer")}>
  <slot name="trigger" />
</div>

<div bind:this={tooltip} class="hidden">
  <div>
    <slot name="tooltip" {instance} />
  </div>
</div>
