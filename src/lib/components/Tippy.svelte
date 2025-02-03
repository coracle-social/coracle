<script lang="ts">
  import "tippy.js/animations/shift-away.css"

  import {onMount} from "svelte"
  import type {Component, ComponentProps} from "svelte"
  import tippy, {type Instance, type Props} from "tippy.js"

  export let component: Component
  export let props: ComponentProps<any> = {}
  export let params: Partial<Props> = {}
  export let popover: Instance | undefined = undefined
  export let instance: Component | undefined = undefined

  let element: Element

  $: instance?.$set(props)

  onMount(() => {
    if (element) {
      const target = document.createElement("div")

      popover = tippy(element, {
        content: target,
        animation: "shift-away",
        appendTo: document.querySelector(".tippy-target")!,
        ...params,
      })

      instance = new component({target, props})

      return () => {
        popover?.destroy()
        instance?.$destroy()
      }
    }
  })
</script>

<div bind:this={element} class={$$props.class}>
  <slot />
</div>
