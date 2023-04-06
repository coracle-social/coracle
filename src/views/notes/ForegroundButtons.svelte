<script lang="ts">
  import {fly} from "svelte/transition"
  import {displayRelay} from "src/util/nostr"
  import Anchor from "src/partials/Anchor.svelte"
  import Popover from "src/partials/Popover.svelte"
  import user from "src/agent/user"
  import {modal, globalRelay} from "src/app/ui"

  export let pubkey = null

  const {canPublish} = user
</script>

<div class="fixed bottom-0 right-0 z-10 m-8 flex flex-col items-center gap-3">
  {#if $globalRelay}
    <Popover triggerType="mouseenter" placement="left">
      <div
        slot="trigger"
        transition:fly|local={{y: 20}}
        class="transition-transform hover:scale-105">
        <Anchor type="button-circle" on:click={() => globalRelay.set(null)}>
          <i class="fa fa-filter-circle-xmark mt-1" />
        </Anchor>
      </div>
      <div slot="tooltip">
        Limiting results to {displayRelay({url: $globalRelay})}
      </div>
    </Popover>
  {/if}

  {#if $canPublish}
    <button
      class="color-white flex h-16 w-16 items-center justify-center rounded-full
            border border-accent-light bg-accent text-white shadow-2xl
            transition-all hover:scale-105 hover:bg-accent-light"
      on:click={() => modal.set({type: "note/create", pubkey})}>
      <span class="fa-sold fa-plus fa-2xl" />
    </button>
  {/if}
</div>
