<script lang="ts">
  import {displayRelay, normalizeRelayUrl} from "src/util/nostr"
  import Content from "src/partials/Content.svelte"
  import Feed from "src/app/shared/Feed.svelte"
  import Tabs from "src/partials/Tabs.svelte"
  import RelayTitle from "src/app/shared/RelayTitle.svelte"
  import RelayActions from "src/app/shared/RelayActions.svelte"
  import {relays} from "src/agent/db"

  export let url

  let activeTab = "reviews"

  url = normalizeRelayUrl(url)

  const relay = relays.get(url) || {url}
  const tabs = ["reviews", "notes"]
  const setActiveTab = tab => {
    activeTab = tab
  }

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
  <Tabs borderClass="border-gray-6" {tabs} {activeTab} {setActiveTab} />
  {#if activeTab === "reviews"}
    <Feed
      invertColors
      filter={{
        kinds: [1985],
        "#l": ["review"],
        "#L": ["social.coracle.ontology"],
        "#r": [relay.url],
      }} />
  {:else}
    <Feed invertColors relays={[relay]} filter={{kinds: [1]}} />
  {/if}
</Content>
