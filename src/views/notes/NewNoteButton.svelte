<script lang="ts">
  import user from "src/agent/user"
  import {modal} from "src/app/ui"

  export let pubkey = null

  const {canPublish} = user
</script>

{#if $canPublish}
  <div class="fixed bottom-0 right-0 m-8">
    <button
      title="Create new note"
      class="color-white flex h-16 w-16 items-center justify-center rounded-full
            border border-accent-light bg-accent text-white shadow-2xl
            transition-all hover:bg-accent-light"
      on:click={() => modal.set({type: "note/create", pubkey})}>
      <span class="fa-sold fa-plus fa-2xl" />
    </button>
  </div>
{/if}
