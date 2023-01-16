<script>
  import {navigate} from 'svelte-routing'
  import Input from "src/partials/Input.svelte"
  import Content from 'src/partials/Content.svelte'
  import Tabs from 'src/partials/Tabs.svelte'
  import SearchPeople from 'src/views/SearchPeople.svelte'
  import SearchNotes from 'src/views/SearchNotes.svelte'

  export let activeTab

  let q = ''

  const setActiveTab = tab => navigate(`/search/${tab}`)
</script>

<Content>
  <Tabs tabs={['people', 'notes']} {activeTab} {setActiveTab} />
  <Input bind:value={q} placeholder="Search for people">
    <i slot="before" class="fa-solid fa-search" />
  </Input>
  {#if activeTab === 'people'}
  <SearchPeople {q} />
  {:else if activeTab === 'notes'}
  <SearchNotes {q} />
  {/if}
</Content>
