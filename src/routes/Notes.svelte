<script>
  import {navigate} from 'svelte-routing'
  import Anchor from "src/partials/Anchor.svelte"
  import Tabs from "src/partials/Tabs.svelte"
  import Network from "src/views/notes/Network.svelte"
  import Latest from "src/views/notes/Latest.svelte"
  import {user} from 'src/agent'

  export let activeTab

  const setActiveTab = tab => navigate(`/notes/${tab}`)
</script>

{#if !$user}
<div class="flex w-full justify-center items-center py-16">
  <div class="text-center max-w-sm">
    Don't have an account? Click <Anchor href="/login">here</Anchor> to join the nostr network.
  </div>
</div>
{/if}

<Tabs tabs={['latest', 'network']} {activeTab} {setActiveTab} />

{#if activeTab === 'network'}
<Network />
{:else}
<Latest />
{/if}
