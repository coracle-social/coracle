<script>
  import {navigate} from 'svelte-routing'
  import Anchor from "src/partials/Anchor.svelte"
  import Content from "src/partials/Content.svelte"
  import Tabs from "src/partials/Tabs.svelte"
  import Network from "src/views/notes/Network.svelte"
  import Global from "src/views/notes/Global.svelte"
  import {user} from 'src/agent'

  export let activeTab

  const setActiveTab = tab => navigate(`/notes/${tab}`)
</script>

<Content>
  {#if !$user}
  <Content size="lg" class="text-center">
    <p>
      Don't have an account? Click <Anchor href="/login">here</Anchor> to join the nostr network.
    </p>
  </Content>
  {/if}

  <div>
    <Tabs tabs={['network', 'global']} {activeTab} {setActiveTab} />
    {#if activeTab === 'network'}
    <Network />
    {:else}
    <Global />
    {/if}
  </div>
</Content>
