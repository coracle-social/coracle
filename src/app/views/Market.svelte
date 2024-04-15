<script lang="ts">
  import {Scope, filterFeed} from "@coracle.social/feeds"
  import Card from "src/partials/Card.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Feed from "src/app/shared/Feed.svelte"
  import {router} from "src/app/router"
  import {env, canSign, loadGroupMessages} from "src/engine"

  const feed = $env.FORCE_GROUP
    ? filterFeed({kinds: [30402], "#a": [$env.FORCE_GROUP]})
    : filterFeed({kinds: [30402], scopes: [Scope.Self, Scope.Follows]})

  const createListing = () => router.at("notes/create").qp({type: "listing"}).open()

  if ($env.FORCE_GROUP) {
    loadGroupMessages([$env.FORCE_GROUP])
  }
</script>

{#if $canSign}
  <Card class="flex justify-between">
    Have something you'd like to sell on nostr?
    <Anchor button accent on:click={createListing}>Create a listing</Anchor>
  </Card>
{/if}

<Feed hideControls={Boolean($env.FORCE_GROUP)} {feed} />
