<script lang="ts">
  import user from "src/agent/user"
  import {modal, location} from "src/app/ui"

  $: showCreateNote = $location.pathname.match(/messages|chat|relays$|keys|settings|logout$/)

  const {canPublish} = user

  const createNote = () => {
    const pubkey = null // TODO use $location.pathname

    modal.set({type: "note/create", pubkey})
  }
</script>

<div class="fixed bottom-0 right-0 z-10 m-8 flex flex-col items-center gap-3">
  {#if $canPublish && !showCreateNote}
    <button
      class="color-white flex h-16 w-16 items-center justify-center rounded-full
            border border-accent-light bg-accent text-white shadow-2xl
            transition-all hover:scale-105 hover:bg-accent-light"
      on:click={createNote}>
      <span class="fa-sold fa-plus fa-2xl" />
    </button>
  {/if}
</div>
