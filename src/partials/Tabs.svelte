<script lang="ts">
  import {toTitle} from "hurdak"

  export let tabs: string[]
  export let activeTab
  export let setActiveTab
</script>

<div class="relative flex items-center justify-between overflow-auto pb-px pt-1">
  <div class="absolute bottom-px left-0 right-0 h-px w-full bg-mid" />
  <div class="flex">
    {#each tabs as tab}
      <button
        class="relative flex cursor-pointer items-end gap-2 border-b border-solid px-8 pb-4 transition-colors hover:border-lighter"
        class:border-transparent={activeTab !== tab}
        class:border-lighter={activeTab === tab}
        on:click|preventDefault={() => setActiveTab(tab)}>
        <slot name="tab" {tab}>{toTitle(tab)}</slot>
      </button>
    {/each}
  </div>
  <slot />
</div>
