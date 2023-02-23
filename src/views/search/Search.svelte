<script>
  import {navigate} from 'svelte-routing'
  import Content from 'src/partials/Content.svelte'
  import Tabs from 'src/partials/Tabs.svelte'
  import SearchPeople from 'src/views/search/SearchPeople.svelte'
  import Scan from 'src/views/search/Scan.svelte'

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
