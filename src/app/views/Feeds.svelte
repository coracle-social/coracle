<script lang="ts">
  import Anchor from "src/partials/Anchor.svelte"
  import Feed from "src/app/shared/Feed.svelte"
  import {router} from "src/app/util/router"
  import {globalFeed} from "src/app/state"
  import {session} from "src/engine"

  const showLogin = () => router.at("login").open()

  document.title = "Feeds"
</script>

{#if !$session}
  <div class="py-16 text-center">
    <p class="text-xl">Don't have an account?</p>
    <p>
      Click <Anchor class="underline" on:click={showLogin}>here</Anchor> to join the nostr network.
    </p>
  </div>
{/if}

<Feed skipCache showControls showGroup bind:feed={$globalFeed} />
