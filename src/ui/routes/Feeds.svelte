<script>
  import {navigate} from "svelte-routing"
  import {toTitle} from "hurdak/lib/hurdak"
  import Anchor from "src/ui/partials/Anchor.svelte"
  import Content from "src/ui/partials/Content.svelte"
  import Tabs from "src/ui/partials/Tabs.svelte"
  import Follows from "src/ui/views/feed/Follows.svelte"
  import Network from "src/ui/views/feed/Network.svelte"
  import user from "src/agent/user"

  export let activeTab

  const setActiveTab = tab => navigate(`/notes/${tab}`)

  document.title = toTitle(activeTab)
</script>

<Content>
  {#if !user.getProfile()}
    <Content size="lg" class="text-center">
      <p class="text-xl">Don't have an account?</p>
      <p>
        Click <Anchor href="/login">here</Anchor> to join the nostr network.
      </p>
    </Content>
  {/if}
  <div>
    <Tabs tabs={["follows", "network"]} {activeTab} {setActiveTab} />
    {#if activeTab === "follows"}
      <Follows />
    {:else}
      <Network />
    {/if}
  </div>
</Content>
