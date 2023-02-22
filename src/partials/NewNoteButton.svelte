<script lang="ts">
  import user from 'src/agent/user'
  import {modal} from "src/app/ui"

  export let pubkey = null

  const {canPublish} = user
</script>

{#if $canPublish}
<div class="fixed bottom-0 right-0 m-8">
  <button
    class="rounded-full bg-accent color-white w-16 h-16 flex justify-center
            items-center border border-dark shadow-2xl"
    on:click={() => modal.set({type: 'note/create', pubkey})}>
    <span class="fa-sold fa-plus fa-2xl" />
  </button>
</div>
{/if}
