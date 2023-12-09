<script lang="ts">
  import cx from 'classnames'
  import {toTitle} from "hurdak"

  export let tabs: string[]
  export let activeTab
  export let setActiveTab
</script>

<div class="relative flex flex-col">
  <div class="relative h-px bg-mid" style="top: 2.8rem" />
  <div class="flex items-center overflow-auto h-12">
    {#each tabs as tab}
      <button
        class="relative z-feature tab flex cursor-pointer gap-2 border-solid border-b border-transparent hover:border-lightest px-8 pb-4 items-end transition-colors"
        class:!border-lightest={activeTab === tab}
        on:click|preventDefault={() => setActiveTab(tab)}>
        <slot name="tab" {tab}>{toTitle(tab)}</slot>
      </button>
    {/each}
  </div>
  <slot />
</div>
