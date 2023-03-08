<script>
  import {fly} from "svelte/transition"
  import {toTitle} from "hurdak/lib/hurdak"

  export let tabs
  export let activeTab
  export let setActiveTab
  export let getDisplay = tab => ({title: toTitle(tab), badge: null})
</script>

<div class="flex overflow-auto border-b border-solid border-dark pt-2" in:fly={{y: 20}}>
  {#each tabs as tab}
    {@const {title, badge} = getDisplay(tab)}
    <button
      class="flex cursor-pointer gap-2 border-solid border-medium px-8 py-4 hover:border-b"
      class:border-b={activeTab === tab}
      on:click={() => setActiveTab(tab)}>
      <div>{title}</div>
      {#if badge}
        <div class="h-6 rounded-full bg-medium px-2">{badge}</div>
      {/if}
    </button>
  {/each}
</div>
