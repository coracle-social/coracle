<script lang="ts">
  import type {Snippet} from "svelte"
  import {page} from "$app/stores"

  type Props = {
    children?: Snippet
  }

  const {children}: Props = $props()
</script>

{#key $page.params.relay}
  {@render children?.()}
{/key}
