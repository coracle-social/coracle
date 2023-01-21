<script>
  import {fly} from 'svelte/transition'
  import Anchor from 'src/partials/Anchor.svelte'
  import Content from "src/partials/Content.svelte"
  import {db} from 'src/agent'

  let confirmed = false

  const confirm = async () => {
    confirmed = true

    localStorage.clear()
    await db.delete()

    // do a hard refresh so everything gets totally cleared.
    // Give them a moment to see the state transition. Dexie
    // also apparently needs some time
    setTimeout(() => {
      window.location = '/login'
    }, 1000)
  }
</script>

<Content size="lg" class="text-center">
  {#if confirmed}
  <div in:fly={{y:20}}>Clearing your local database...</div>
  {:else}
  <div class="flex flex-col gap-8 items-center" in:fly={{y:20}}>
    <div>Are you sure you want to log out? All data will be cleared.</div>
    <Anchor type="button" on:click={confirm}>Log out</Anchor>
  </div>
  {/if}
</Content>
