<script>
  import {fly} from 'svelte/transition'
  import {toTitle} from 'hurdak/lib/hurdak'

  export let tabs
  export let activeTab
  export let setActiveTab
</script>

<div class="border-b border-solid border-dark flex pt-2 overflow-auto" in:fly={{y: 20}}>
  {#each tabs as tab}
  <button
    class="cursor-pointer hover:border-b border-solid border-medium px-8 py-4"
    class:border-b={activeTab === tab}
    on:click={() => setActiveTab(tab)}>
    {toTitle(tab)}
  </button>
  {/each}
</div>
