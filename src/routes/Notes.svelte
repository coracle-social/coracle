<script>
  import {navigate} from 'svelte-routing'
  import Anchor from "src/partials/Anchor.svelte"
  import Tabs from "src/partials/Tabs.svelte"
  import Network from "src/views/notes/Network.svelte"
  import Global from "src/views/notes/Global.svelte"
  import {connections, user} from 'src/relay'

  export let activeTab

  const setActiveTab = tab => navigate(`/notes/${tab}`)
</script>

{#if $connections.length === 0}
<div class="flex w-full justify-center items-center py-16">
  <div class="text-center max-w-md">
    You aren't yet connected to any relays. Please click <Anchor href="/relays"
      >here</Anchor
    > to get started.
  </div>
</div>
{:else if $user}
<Tabs tabs={['network', 'global']} {activeTab} {setActiveTab} />
{#if activeTab === 'network'}
<Network />
{:else}
<Global />
{/if}
{:else}
<div class="flex w-full justify-center items-center py-16">
  <div class="text-center max-w-sm">
    Don't have an account? Click <Anchor href="/login">here</Anchor> to join the nostr network.
  </div>
</div>
<Global />
{/if}

