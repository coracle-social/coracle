<script lang="ts">
  import type {Editor} from "@tiptap/core"
  import {onDestroy, onMount} from "svelte"

  export let editor: Editor

  let element: HTMLElement

  onMount(() => {
    if (element) {
      element.append(...(Array.from(editor.options.element.childNodes) as any))
      editor.setOptions({element})
      // @ts-ignore
      editor.contentElement = element
    }
  })

  onDestroy(() => {
    // @ts-ignore
    editor.contentElement = null
    editor.setOptions({element: null})
    editor.destroy()
  })
</script>

<div class="relative flex w-full overflow-x-hidden">
  <div {...$$props} bind:this={element} class="relative w-full min-w-0 {$$props.class}" />
  <slot name="addon" />
</div>
