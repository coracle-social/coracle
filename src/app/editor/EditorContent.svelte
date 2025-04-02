<script lang="ts">
  import type {Editor} from "@welshman/editor"
  import {onMount} from "svelte"

  export let editor: Editor

  let element: HTMLElement

  onMount(() => {
    if (editor.options.element) {
      element?.append(editor.options.element)
    }

    if (editor.options.autofocus) {
      ;(element?.querySelector("[contenteditable]") as HTMLElement)?.focus()
    }
  })
</script>

<div class="relative flex w-full overflow-x-hidden">
  <div {...$$props} bind:this={element} class="relative grid w-full min-w-0 {$$props.class}" />
  <slot name="addon" />
</div>
