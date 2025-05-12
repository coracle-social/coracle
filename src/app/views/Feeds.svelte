<script lang="ts">
  import {pubkey} from "@welshman/app"
  import Anchor from "src/partials/Anchor.svelte"
  import Feed from "src/app/shared/Feed.svelte"
  import {router} from "src/app/util/router"
  import {defaultFeed} from "src/engine"

  export let feed = null

  const showLogin = () => router.at("login").open()

  document.title = "Feeds"
</script>

{#if !$pubkey}
  <div class="py-16 text-center">
    <p class="text-xl">Don't have an account?</p>
    <p>
      Click <Anchor underline on:click={showLogin}>here</Anchor> to join the nostr network.
    </p>
  </div>
{/if}

<Feed showControls feed={feed || $defaultFeed} />
