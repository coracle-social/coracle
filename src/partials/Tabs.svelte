<script>
  import {fly} from 'svelte/transition'
  import {toTitle} from 'hurdak/lib/hurdak'

  export let tabs
  export let activeTab
  export let setActiveTab
  export let getDisplay = tab => ({title: toTitle(tab), badge: null})
</script>

<div class="border-b border-solid border-dark flex pt-2 overflow-auto" in:fly={{y: 20}}>
  {#each tabs as tab}
  {@const {title, badge} = getDisplay(tab)}
  <button
    class="cursor-pointer hover:border-b border-solid border-medium px-8 py-4 flex gap-2"
    class:border-b={activeTab === tab}
    on:click={() => setActiveTab(tab)}>
    <div>{title}</div>
    {#if badge}
    <div class="rounded-full bg-medium px-2 h-6">{badge}</div>
    {/if}
  </button>
  {/each}
</div>
