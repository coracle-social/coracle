<script lang="ts">
  import type {Snippet} from "svelte"

  interface Props {
    icon?: Snippet
    title?: Snippet
    action?: Snippet
    [key: string]: any
  }

  const {...props}: Props = $props()
</script>

<div data-component="PageBar" class="cw top-sai fixed z-feature p-2">
  <div
    class="flex min-h-12 items-center justify-between gap-4 rounded-xl rounded-xl bg-base-100 px-4 shadow-xl">
    <div class="ellipsize flex items-center gap-4 whitespace-nowrap">
      {@render props.icon?.()}
      {@render props.title?.()}
    </div>
    {@render props.action?.()}
  </div>
</div>
