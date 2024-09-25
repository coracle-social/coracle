<script lang="ts">
  import {onMount} from 'svelte'
  import type {SvelteComponent, ComponentType, ComponentProps} from 'svelte'
  import tippy, {type Instance, type Props} from "tippy.js"

  export let component: ComponentType
  export let props: ComponentProps<any> = {}
  export let params: Partial<Props> = {}
  export let popover: Instance | undefined = undefined
  export let instance: SvelteComponent | undefined = undefined

  let element: Element

  $: instance?.$set(props)

  onMount(() => {
    const target = document.createElement("div")

    popover = tippy(element, {content: target, ...params})

    instance = new component({target, props})

    return () => {
      popover?.destroy()
      instance?.$destroy()
    }
  })
</script>

<div bind:this={element} />
