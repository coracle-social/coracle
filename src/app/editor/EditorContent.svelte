<script lang="ts">
  import {onDestroy, onMount} from "svelte"

  const {editor} = $props()

  let element: HTMLElement

  onMount(() => {
    if (element) {
      element.append(...(Array.from(editor.options.element.childNodes) as any))
      editor.setOptions({element})
      editor.contentElement = element
    }
  })

  onDestroy(() => {
    editor.contentElement = null
    editor.setOptions({element: null})
  })
</script>

<div bind:this={element}></div>
