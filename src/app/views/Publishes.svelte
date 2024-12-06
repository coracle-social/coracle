<script lang="ts">
  import PublishesConnections from "src/app/views/PublishesConnections.svelte"
  import PublishesNotices from "src/app/views/PublishesNotices.svelte"
  import PublishesEvents from "src/app/views/PublishesEvents.svelte"
  import Subheading from "src/partials/Subheading.svelte"
  import Tabs from "src/partials/Tabs.svelte"

  const tabs = ["events", "connections", "notices"]
  let activeTab = "events"

  let selected: string
</script>

<Subheading>Published Events</Subheading>
<Tabs {tabs} {activeTab} setActiveTab={tab => (activeTab = tab)} />
{#if activeTab === "events"}
  <PublishesEvents />
{:else if activeTab === "connections"}
  <PublishesConnections bind:selected bind:activeTab />
{:else if activeTab === "notices"}
  <PublishesNotices search={selected} />
{/if}
