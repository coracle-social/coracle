<script lang="ts">
  import {displayRelay} from "src/util/nostr"
  import Content from "src/partials/Content.svelte"
  import Feed from "src/app/shared/Feed.svelte"
  import RelayTitle from "src/app/shared/RelayTitle.svelte"
  import RelayActions from "src/app/shared/RelayActions.svelte"
  import {relays} from "src/agent/db"

  export let url

  if (!url.startsWith("ws")) {
    url = "wss://" + url
  }

  const relay = relays.get(url) || {url}

  document.title = displayRelay(relay)
</script>

<Content>
  <div class="flex items-center justify-between gap-2">
    <RelayTitle {relay} />
    <RelayActions {relay} />
  </div>
  {#if relay.description}
    <p>{relay.description}</p>
  {/if}
</Content>
<div class="border-b border-solid border-gray-6" />
<Content>
  <Feed relays={[relay]} filter={{kinds: [1]}} />
</Content>
