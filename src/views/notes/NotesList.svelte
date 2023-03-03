<script>
  import {navigate} from 'svelte-routing'
  import {toTitle} from 'hurdak/lib/hurdak'
  import Anchor from "src/partials/Anchor.svelte"
  import Content from "src/partials/Content.svelte"
  import Tabs from "src/partials/Tabs.svelte"
  import NewNoteButton from "src/views/notes/NewNoteButton.svelte"
  import Follows from "src/views/notes/Follows.svelte"
  import Network from "src/views/notes/Network.svelte"
  import user from 'src/agent/user'

  export let activeTab

  const setActiveTab = tab => navigate(`/notes/${tab}`)

  document.title = toTitle(activeTab)
</script>

<Content>
  {#if !user.getProfile()}
  <Content size="lg" class="text-center">
    <p class="text-xl">Don't have an account?</p>
    <p>Click <Anchor href="/login">here</Anchor> to join the nostr network.</p>
  </Content>
  {/if}
  <div>
    <Tabs tabs={['follows', 'network']} {activeTab} {setActiveTab} />
    {#if activeTab === 'follows'}
    <Follows />
    {:else}
    <Network />
    {/if}
  </div>
</Content>

<NewNoteButton />
