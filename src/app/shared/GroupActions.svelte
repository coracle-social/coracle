<script lang="ts">
  import GroupActionsOpen from "src/app/shared/GroupActionsOpen.svelte"
  import GroupActionsClosed from "src/app/shared/GroupActionsClosed.svelte"

  export let address
  export let claim = null
</script>

{#if address.startsWith("34550:")}
  <GroupActionsOpen {address} />
{/if}

{#if address.startsWith("35834:")}
  <GroupActionsClosed {address} {claim} />
{/if}
