<script>
  import {navigate} from "svelte-routing"
  import {toTitle} from "hurdak/lib/hurdak"
  import Anchor from "src/partials/Anchor.svelte"
  import Content from "src/partials/Content.svelte"
  import Tabs from "src/partials/Tabs.svelte"
  import FeedsFollows from "src/app2/views/FeedsFollows.svelte"
  import FeedsNetwork from "src/app2/views/FeedsNetwork.svelte"
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
      <FeedsFollows />
    {:else}
      <FeedsNetwork />
    {/if}
  </div>
</Content>
