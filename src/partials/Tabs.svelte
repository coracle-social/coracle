<script lang="ts">
  import {toTitle} from "hurdak"

  export let tabs
  export let activeTab
  export let setActiveTab
  export let getDisplay = tab => ({title: toTitle(tab), badge: null})
  export let borderClass = "border-gray-7"
</script>

<div
  class={`flex items-center justify-between overflow-auto border-b border-solid pt-2 ${borderClass}`}>
  <div class="flex">
    {#each tabs as tab}
      {@const {title, badge} = getDisplay(tab)}
      <button
        class="flex cursor-pointer gap-2 border-solid border-gray-6 px-8 py-4 hover:border-b"
        class:border-b={activeTab === tab}
        on:click|preventDefault={() => setActiveTab(tab)}>
        <div>{title}</div>
        {#if badge}
          <div class="h-6 rounded-full bg-gray-6 px-2">{badge}</div>
        {/if}
      </button>
    {/each}
  </div>
  <slot />
</div>
