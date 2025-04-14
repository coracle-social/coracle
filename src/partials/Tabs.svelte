<script lang="ts">
  import cx from "classnames"
  import {toTitle} from "src/util/misc"

  export let tabs: string[]
  export let activeTab
  export let setActiveTab
</script>

<div
  class={cx($$props.class, "relative flex items-center justify-between overflow-auto pb-px pt-1")}>
  <div class="absolute bottom-px left-0 right-0 h-px w-full bg-neutral-700" />
  <div class="flex w-full">
    {#each tabs as tab}
      <button
        class="relative flex flex-grow cursor-pointer items-end justify-center gap-2 border-b border-solid pb-4 transition-colors hover:border-neutral-500"
        class:border-neutral-700={activeTab !== tab}
        class:border-neutral-500={activeTab === tab}
        class:opacity-75={activeTab !== tab}
        on:click|preventDefault={() => setActiveTab(tab)}>
        <slot name="tab" {tab}>{toTitle(tab)}</slot>
      </button>
    {/each}
  </div>
  <slot />
</div>
