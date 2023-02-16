<script>
  import {navigate} from 'svelte-routing'
  import Content from 'src/partials/Content.svelte'
  import Tabs from 'src/partials/Tabs.svelte'
  import Modal from 'src/partials/Modal.svelte'
  import SearchPeople from 'src/views/SearchPeople.svelte'
  import RelayList from "src/routes/RelayList.svelte"
  import Scan from 'src/views/Scan.svelte'
  import {relays} from 'src/agent/relays'

  export let activeTab

  const setActiveTab = tab => navigate(`/search/${tab}`)
</script>

<Content>
  <Tabs tabs={['people', 'advanced']} {activeTab} {setActiveTab} />
  {#if activeTab === 'people'}
  <SearchPeople />
  {:else if activeTab === 'advanced'}
  <Scan />
  {/if}
</Content>

{#if $relays.length === 0}
<Modal>
  <RelayList />
</Modal>
{/if}
