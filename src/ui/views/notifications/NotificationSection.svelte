<script lang="ts">
  import Badge from "src/ui/partials/Badge.svelte"
  import {getPersonWithFallback} from "src/agent/tables"

  export let pubkeys
</script>

<div class="flex flex-col gap-2">
  <slot />
  <div class="flex flex-col gap-1">
    {#each pubkeys as pubkey}
      <Badge person={getPersonWithFallback(pubkey)} />
    {/each}
  </div>
</div>
