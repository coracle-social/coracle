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

<div class="sait cw fixed top-2 z-feature rounded-xl px-2 pt-2 {props.class}">
  <div
    class="flex min-h-12 items-center justify-between gap-4 rounded-xl bg-base-100 px-4 shadow-xl">
    <div class="ellipsize flex items-center gap-4 whitespace-nowrap">
      {@render props.icon?.()}
      {@render props.title?.()}
    </div>
    {@render props.action?.()}
  </div>
</div>
