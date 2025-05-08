<script lang="ts">
  interface Props {
    children?: import("svelte").Snippet
  }

  const {children}: Props = $props()
</script>

<div
  class="ml-sai mt-sai mb-sai hidden max-h-screen w-60 flex-shrink-0 flex-col gap-1 bg-base-300 md:flex">
  {@render children?.()}
</div>
