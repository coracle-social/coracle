<script>
  import {fly} from 'svelte/transition'
  import {toTitle} from 'hurdak/lib/hurdak'

  export let tabs
  export let activeTab
  export let setActiveTab
</script>

<ul class="border-b border-solid border-dark flex max-w-xl m-auto pt-2" in:fly={{y: 20}}>
  {#each tabs as tab}
  <li
    class="cursor-pointer hover:border-b border-solid border-medium px-8 py-4"
    class:border-b={activeTab === tab}
    on:click={() => setActiveTab(tab)}>
    {toTitle(tab)}
  </li>
  {/each}
</ul>
