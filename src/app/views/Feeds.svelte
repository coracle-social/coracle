<script lang="ts">
  import {makeRelayFeed, makeScopeFeed, Scope} from "@welshman/feeds"
  import {session} from "@welshman/app"
  import Anchor from "src/partials/Anchor.svelte"
  import Feed from "src/app/shared/Feed.svelte"
  import {router} from "src/app/util/router"
  import {makeFeed} from "src/domain"
  import {env, loadCircleMessages} from "src/engine"

  export let feed = null

  const isPlatformFeed = env.PLATFORM_RELAYS.length > 0

  const showLogin = () => router.at("login").open()

  if (isPlatformFeed) {
    feed = makeFeed({definition: makeRelayFeed(...env.PLATFORM_RELAYS)})
  } else if (!feed) {
    feed = makeFeed({definition: makeScopeFeed(Scope.Follows)})
  }

  if (env.FORCE_GROUP) {
    loadCircleMessages([env.FORCE_GROUP])
  }

  document.title = "Feeds"
</script>

{#if !$session}
  <div class="py-16 text-center">
    <p class="text-xl">Don't have an account?</p>
    <p>
      Click <Anchor underline on:click={showLogin}>here</Anchor> to join the nostr network.
    </p>
  </div>
{/if}

<Feed showGroup showControls={!isPlatformFeed} {feed} />
