<script lang="ts">
  import {page} from "$app/stores"
  interface Props {
    children?: import("svelte").Snippet
  }

  const {children}: Props = $props()
</script>

{#key $page.params.relay}
  {@render children?.()}
{/key}
