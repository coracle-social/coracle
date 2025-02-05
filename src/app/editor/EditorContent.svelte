<script lang="ts">
  import {onDestroy, onMount} from "svelte"

  const {editor} = $props()

  let element: HTMLElement

  onMount(() => {
    if (editor.options.element) {
      element?.append(editor.options.element)
    }

    if (editor.options.autofocus) {
      ;(element?.querySelector("[contenteditable]") as HTMLElement)?.focus()
    }
  })

  onDestroy(() => {
    editor.destroy()
  })
</script>

<div bind:this={element}></div>
