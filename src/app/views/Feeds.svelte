<script lang="ts">
  import {Scope, makeScopeFeed, makeRelayFeed, makeIntersectionFeed} from "@welshman/feeds"
  import type {Feed as TFeed} from "@welshman/feeds"
  import Anchor from "src/partials/Anchor.svelte"
  import Feed from "src/app/shared/Feed.svelte"
  import {router} from "src/app/util/router"
  import {session} from "src/engine"

  export let relays = []
  export let feed: TFeed = makeScopeFeed(Scope.Follows)

  if (relays.length > 0) {
    feed = makeIntersectionFeed(makeRelayFeed(...relays), feed)
  }

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

<Feed skipCache showControls showGroup {feed} />
