<script lang="ts">
  import {makeScopeFeed, makeAuthorFeed, Scope} from "@welshman/feeds"
  import {pubkey} from "@welshman/app"
  import Anchor from "src/partials/Anchor.svelte"
  import Feed from "src/app/shared/Feed.svelte"
  import {router} from "src/app/util/router"
  import {makeFeed} from "src/domain"
  import {env, userFollows} from "src/engine"

  export let feed = null

  const showLogin = () => router.at("login").open()

  if (!feed) {
    if ($userFollows?.size > 0) {
      feed = makeFeed({definition: makeScopeFeed(Scope.Follows)})
    } else {
      feed = makeFeed({definition: makeAuthorFeed(...env.DEFAULT_FOLLOWS)})
    }
  }

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

<Feed showControls {feed} />
