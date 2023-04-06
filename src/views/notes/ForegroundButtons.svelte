<script lang="ts">
  import {fly} from "svelte/transition"
  import {quantify} from "hurdak/lib/hurdak"
  import Anchor from "src/partials/Anchor.svelte"
  import Popover from "src/partials/Popover.svelte"
  import user from "src/agent/user"
  import {modal, globalRelays} from "src/app/ui"

  export let pubkey = null

  const {canPublish} = user

  const openModal = () => {
    modal.set({type: "relays/global"})
  }
</script>

<div class="fixed bottom-0 right-0 z-10 m-8 flex flex-col items-center gap-3">
  <div
    transition:fly|local={{y: 20}}
    class="transition-transform hover:scale-105 relative">
    <Anchor type="button-circle" on:click={openModal}>
      <i class="fa fa-filter mt-1" />
      <span class="rounded-full absolute w-5 h-5 text-xs bottom-0 right-0 bg-gray-1
                   border border-solid border-gray-3 flex justify-center items-center
                   -mr-1">
        {$globalRelays.length}
      </span>
    </Anchor>
  </div>

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
