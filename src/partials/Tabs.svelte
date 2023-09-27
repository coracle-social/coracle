<script lang="ts">
  import {toTitle} from "hurdak"

  export let tabs: string[]
  export let activeTab
  export let setActiveTab
  export let borderClass = "border-gray-7"
</script>

<div
  class={`flex items-center justify-between overflow-auto border-b border-solid pt-2 ${borderClass}`}>
  <div class="flex">
    {#each tabs as tab}
      <button
        class="flex cursor-pointer gap-2 border-solid border-gray-6 px-8 py-4 hover:border-b"
        class:border-b={activeTab === tab}
        on:click|preventDefault={() => setActiveTab(tab)}>
        <slot name="tab" {tab}>{toTitle(tab)}</slot>
      </button>
    {/each}
  </div>
  <slot />
</div>
