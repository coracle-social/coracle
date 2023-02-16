<script>
  import {navigate} from 'svelte-routing'
  import Anchor from "src/partials/Anchor.svelte"
  import Content from "src/partials/Content.svelte"
  import NewNoteButton from "src/partials/NewNoteButton.svelte"
  import Tabs from "src/partials/Tabs.svelte"
  import Modal from 'src/partials/Modal.svelte'
  import RelayList from "src/routes/RelayList.svelte"
  import Network from "src/views/notes/Network.svelte"
  import Popular from "src/views/notes/Popular.svelte"
  import {relays} from 'src/agent/relays'
  import {user, follows} from 'src/agent/user'

  export let activeTab

  const {petnames} = follows
  const setActiveTab = tab => navigate(`/notes/${tab}`)

  // If they're not following anyone, skip network tab
  if ($petnames.length === 0) {
    setActiveTab('popular')
  }
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

{#if $relays.length === 0}
<Modal>
  <RelayList />
</Modal>
{/if}
