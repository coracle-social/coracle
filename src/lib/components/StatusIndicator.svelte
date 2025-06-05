<script lang="ts">
  import type {Snippet} from "svelte"

  type Props = {
    children: Snippet
    class: string
  }

  const {children, ...props}: Props = $props()
</script>

<div class="flex items-center gap-2">
  <div class="h-2 w-2 rounded-full {props.class}"></div>
  <span class="text-sm">{@render children()}</span>
</div>
