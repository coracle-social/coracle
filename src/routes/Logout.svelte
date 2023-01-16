<script>
  import {fly} from 'svelte/transition'
  import Anchor from 'src/partials/Anchor.svelte'
  import {db} from 'src/agent'

  let confirmed = false

  const confirm = () => {
    confirmed = true

    // Give them a moment to see the state transition
    setTimeout(async () => {
      localStorage.clear()
      await db.delete()

      // do a hard refresh so everything gets totally cleared
      window.location = '/login'
    }, 300)
  }
</script>

<div class="max-w-xl m-auto text-center py-20">
  {#if confirmed}
  <div in:fly={{y:20}}>Clearing your local database...</div>
  {:else}
  <div class="flex flex-col gap-8 items-center" in:fly={{y:20}}>
    <div>Are you sure you want to log out? All data will be cleared.</div>
    <Anchor type="button" on:click={confirm}>Log out</Anchor>
  </div>
  {/if}
</div>
