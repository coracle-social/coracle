<style>
  :global(a[data-type="tag"]) {
    text-decoration: underline;
  }
</style>

<script lang="ts">
  import cx from "classnames"
  import {onDestroy} from "svelte"
  import {Editor} from "svelte-tiptap"

  export let element: HTMLElement
  export let editor: Editor

  onDestroy(() => editor?.destroy())
</script>

<div class="relative flex w-full overflow-x-hidden">
  <div bind:this={element} style={$$props.style} class={cx($$props.class, "relative w-full")} />
  <slot name="addon" />
</div>
