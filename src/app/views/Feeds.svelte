<script lang="ts">
  import {Scope, makeScopeFeed} from "@welshman/feeds"
  import Anchor from "src/partials/Anchor.svelte"
  import Feed from "src/app/shared/Feed.svelte"
  import {router} from "src/app/util/router"
  import {feed as feedStore} from "src/app/state"
  import {makeFeed} from "src/domain"
  import {session} from "src/engine"

  feedStore.set(
    makeFeed({
      definition: makeScopeFeed(Scope.Follows),
    }),
  )

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

<Feed skipCache showControls showGroup bind:feed={$feedStore} />
