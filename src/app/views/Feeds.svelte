<script lang="ts">
  import {makeRelayFeed} from "@welshman/feeds"
  import Anchor from "src/partials/Anchor.svelte"
  import Feed from "src/app/shared/Feed.svelte"
  import {router} from "src/app/util/router"
  import {globalFeed} from "src/app/state"
  import {makeFeed} from "src/domain"
  import {session, env} from "src/engine"

  const isPlatformFeed = $env.PLATFORM_RELAYS.length > 0

  const showLogin = () => router.at("login").open()

  if (isPlatformFeed) {
    globalFeed.set(makeFeed({definition: makeRelayFeed(...$env.PLATFORM_RELAYS)}))
  }

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

<Feed skipCache showGroup showControls={!isPlatformFeed} bind:feed={$globalFeed} />
