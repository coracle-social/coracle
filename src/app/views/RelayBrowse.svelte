<script lang="ts">
  import {appName} from "src/partials/state"
  import Tabs from "src/partials/Tabs.svelte"
  import Content from "src/partials/Content.svelte"
  import Heading from "src/partials/Heading.svelte"
  import Feed from "src/app/shared/Feed.svelte"
  import RelaySearch from "src/app/shared/RelaySearch.svelte"

  let activeTab = "search"

  const tabs = ["search", "reviews"]

  const setActiveTab = tab => {
    activeTab = tab
  }
</script>

<Content>
  <div class="flex flex-col items-center justify-center">
    <Heading>Browse Relays</Heading>
    <p>
      {appName} automatically discovers relays as you browse the network. Adding more relays will generally
      make things quicker to load, at the expense of higher data usage.
    </p>
  </div>
  <Tabs {tabs} {activeTab} {setActiveTab} />
  {#if activeTab === "reviews"}
    <Feed
      hideControls
      invertColors
      filter={{
        kinds: [1985],
        "#l": ["review/relay"],
        "#L": ["social.coracle.ontology"],
      }} />
  {:else}
    <RelaySearch />
  {/if}
</Content>
