<script lang="ts">
  import Content from "src/partials/Content.svelte"
  import RelayTitle from "src/views/relays/RelayTitle.svelte"
  import RelayJoin from "src/views/relays/RelayJoin.svelte"
  import {relays} from "src/agent/tables"

  export let url

  const relay = relays.get(url) || {url}
</script>

<Content>
  <div class="flex items-center justify-between gap-2">
    <RelayTitle {relay} />
    <RelayJoin {relay} />
  </div>
  {#if relay.description}
    <p>{relay.description}</p>
  {/if}
</Content>
