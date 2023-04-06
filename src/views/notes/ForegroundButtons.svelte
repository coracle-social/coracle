<script lang="ts">
  import {fly} from "svelte/transition"
  import Anchor from "src/partials/Anchor.svelte"
  import user from "src/agent/user"
  import {modal, muteRelays} from "src/app/ui"

  export let pubkey = null

  const {canPublish} = user

  const openModal = () => {
    modal.set({type: "relays/mute"})
  }
</script>

<div class="fixed bottom-0 right-0 z-10 m-8 flex flex-col items-center gap-3">
  <div transition:fly|local={{y: 20}} class="relative transition-transform hover:scale-105">
    <Anchor type="button-circle-dark" on:click={openModal}>
      <i class="fa fa-filter mt-1" />
      <span
        class="absolute bottom-0 right-0 -mr-1 flex h-5 w-5 items-center
                   justify-center rounded-full border border-solid border-gray-7 bg-gray-8
                   text-xs">
        {$muteRelays.length}
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
