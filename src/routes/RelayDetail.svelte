<script lang="ts">
  import {displayRelay} from "src/util/nostr"
  import Content from "src/partials/Content.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Feed from "src/views/feed/Feed.svelte"
  import RelayTitle from "src/views/relays/RelayTitle.svelte"
  import RelayJoin from "src/views/relays/RelayJoin.svelte"
  import {relays} from "src/agent/tables"
  import {muteRelays} from "src/app/ui"

  export let url

  const relay = relays.get(url) || {url}

  document.title = displayRelay(relay)
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
<div class="border-b border-solid border-gray-6" />
{#if $muteRelays.includes(relay.url)}
  <Content size="lg" class="text-center">
    This relay has been muted.
    <Anchor on:click={() => muteRelays.remove(relay.url)}>Unmute</Anchor>
  </Content>
{:else}
  <Content>
    <Feed relays={[relay]} filter={{kinds: [1]}} />
  </Content>
{/if}
