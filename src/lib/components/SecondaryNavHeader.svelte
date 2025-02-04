<script lang="ts">
  interface Props {
    children?: import("svelte").Snippet
  }

  let {children}: Props = $props()
</script>

<div class="flex items-center justify-between px-4 py-2 text-sm font-bold uppercase">
  {@render children?.()}
</div>
