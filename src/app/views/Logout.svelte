<script lang="ts">
  import {fly} from "src/util/transition"
  import Anchor from "src/partials/Anchor.svelte"
  import Content from "src/partials/Content.svelte"
  import {storage} from "src/engine"

  let confirmed = false

  const confirm = async () => {
    confirmed = true

    await storage.clear()

    // do a hard refresh so everything gets totally cleared.
    // Give them a moment to see the state transition. IndexedDB
    // also apparently needs some time
    setTimeout(() => {
      window.location.href = "/notes"
    }, 1000)
  }

  document.title = "Log Out"
</script>

<Content size="lg" class="text-center">
  {#if confirmed}
    <div in:fly={{y: 20}}>Clearing your local database...</div>
  {:else}
    <div class="flex flex-col items-center gap-8" in:fly={{y: 20}}>
      <div>Are you sure you want to log out? All data will be cleared.</div>
      <Anchor theme="button" on:click={confirm}>Log out</Anchor>
    </div>
  {/if}
</Content>
