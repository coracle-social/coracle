<script lang="ts">
  import "tippy.js/animations/shift-away.css"

  import tippy from "tippy.js"
  import {onMount, mount} from "svelte"

  let {
    component,
    children = undefined,
    props = {},
    params = {},
    popover = $bindable(),
    instance = $bindable(),
    ...restProps
  } = $props()

  const reactiveProps = $derived(props)

  let element: Element

  onMount(() => {
    const target = document.createElement("div")

    popover = tippy(element, {
      content: target,
      animation: "shift-away",
      appendTo: document.querySelector(".tippy-target")!,
      ...params,
    })

    instance = mount(component, {target, props: reactiveProps})

    return () => {
      popover?.destroy()
    }
  })
</script>

<div bind:this={element} class={restProps.class}>
  {@render children?.()}
</div>
