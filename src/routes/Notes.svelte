<script>
  import {onMount, onDestroy} from 'svelte'
  import {navigate} from 'svelte-routing'
  import {findReply} from 'src/util/nostr'
  import Anchor from "src/partials/Anchor.svelte"
  import Tabs from "src/partials/Tabs.svelte"
  import Network from "src/views/notes/Network.svelte"
  import Global from "src/views/notes/Global.svelte"
  import {now, timedelta} from 'src/util/misc'
  import relay, {connections} from 'src/relay'

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
{:else}
<Tabs tabs={['network', 'global']} {activeTab} {setActiveTab} />
{#if activeTab === 'network'}
<Network />
{:else}
<Global />
{/if}
<div class="fixed bottom-0 right-0 p-8">
  <a
    href="/notes/new"
    class="rounded-full bg-accent color-white w-16 h-16 flex justify-center
            items-center border border-dark shadow-2xl cursor-pointer">
    <span class="fa-sold fa-plus fa-2xl" />
  </a>
</div>
{/if}

