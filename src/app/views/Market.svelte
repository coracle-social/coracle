<script lang="ts">
  import Card from "src/partials/Card.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Feed from "src/app/shared/Feed.svelte"
  import type {DynamicFilter} from "src/engine"
  import {router} from "src/app/router"
  import {env, canSign, loadGroupMessages, FilterScope} from "src/engine"

  const filter: DynamicFilter = {kinds: [30402]}

  if ($env.FORCE_GROUP) {
    filter["#a"] = [$env.FORCE_GROUP]
  } else {
    filter.scope = FilterScope.FollowsAndSelf
  }

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

<Feed hideControls={Boolean($env.FORCE_GROUP)} {filter} />
