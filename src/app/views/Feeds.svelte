<script lang="ts">
  import {pubkey} from "@welshman/app"
  import Button from "src/partials/Button.svelte"
  import Feed from "src/app/shared/Feed.svelte"
  import {router} from "src/app/util/router"
  import {defaultFeed} from "src/engine"

  export let feed = null

  const showLogin = () => router.at("login").open()

  const initialFeed = feed || $defaultFeed

  document.title = "Feeds"
</script>

{#if !$pubkey}
  <div class="py-16 text-center">
    <p class="text-xl">Don't have an account?</p>
    <p>
      Click <Button
        class="text-inherit cursor-pointer bg-transparent p-0 underline"
        on:click={showLogin}>here</Button> to join the nostr network.
    </p>
  </div>
{/if}

<Feed showControls feed={initialFeed} />
