<script lang="ts">
  import {Scope, makeScopeFeed, makeRelayFeed, makeIntersectionFeed} from "@welshman/feeds"
  import Anchor from "src/partials/Anchor.svelte"
  import Feed from "src/app/shared/Feed.svelte"
  import {router} from "src/app/util/router"
  import {feed as feedStore} from "src/app/state"
  import {session} from "src/engine"

  export let address = null
  export let feed = makeScopeFeed(Scope.Follows)
  export let relays = []

  feedStore.set(relays.length > 0 ? makeIntersectionFeed(makeRelayFeed(...relays), feed) : feed)

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

<Feed skipCache showControls showGroup bind:feed={$feedStore} {address} />
