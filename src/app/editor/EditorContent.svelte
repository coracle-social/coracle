<script lang="ts">
  import {Editor} from "@welshman/editor"
  import {onDestroy, onMount} from "svelte"

  type Props = {
    editor: Promise<Editor>
  }

  const {editor}: Props = $props()

  let element: HTMLElement

  onMount(() => {
    editor.then(({options}) => {
      if (options.element) {
        element?.append(options.element)
      }

      if (options.autofocus) {
        ;(element?.querySelector("[contenteditable]") as HTMLElement)?.focus()
      }
    })
  })

  onDestroy(() => {
    editor.then($editor => $editor.destroy())
  })
</script>

<div bind:this={element}></div>
