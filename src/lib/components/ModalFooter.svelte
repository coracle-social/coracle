<script lang="ts">
  interface Props {
    children?: import("svelte").Snippet
  }

  const {children}: Props = $props()
</script>

<div class="row-4 mt-4 items-center justify-between">
  {@render children?.()}
</div>
