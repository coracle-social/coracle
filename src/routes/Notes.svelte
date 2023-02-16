<script>
  import {navigate} from 'svelte-routing'
  import Anchor from "src/partials/Anchor.svelte"
  import Content from "src/partials/Content.svelte"
  import NewNoteButton from "src/partials/NewNoteButton.svelte"
  import Tabs from "src/partials/Tabs.svelte"
  import Network from "src/views/notes/Network.svelte"
  import Popular from "src/views/notes/Popular.svelte"
  import {user} from 'src/agent/user'

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
    <Tabs tabs={['network', 'popular']} {activeTab} {setActiveTab} />
    {#if activeTab === 'network'}
    <Network />
    {:else}
    <Popular />
    {/if}
  </div>
</Content>

<NewNoteButton />
