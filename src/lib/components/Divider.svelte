<script lang="ts">
  interface Props {
    children?: import("svelte").Snippet
  }

  const {children}: Props = $props()
</script>

<div class="flex items-center gap-2 p-2 text-xs uppercase opacity-50">
  <div class="h-px flex-grow bg-base-content opacity-25"></div>
  {#if children}
    <p>{@render children?.()}</p>
    <div class="h-px flex-grow bg-base-content opacity-25"></div>
  {/if}
</div>
