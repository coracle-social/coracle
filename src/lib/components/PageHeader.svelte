<script lang="ts">
  interface Props {
    title?: import("svelte").Snippet
    info?: import("svelte").Snippet
  }

  const {title, info}: Props = $props()
</script>

<div class="column gap-4 py-12">
  <h1 class="superheading">{@render title?.()}</h1>
  <p class="text-center">{@render info?.()}</p>
</div>
