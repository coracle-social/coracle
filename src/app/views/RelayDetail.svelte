<script lang="ts">
  import {batch} from "hurdak"
  import {getAvgRating, noteKinds} from "src/util/nostr"
  import Feed from "src/app/shared/Feed.svelte"
  import Tabs from "src/partials/Tabs.svelte"
  import Rating from "src/partials/Rating.svelte"
  import RelayTitle from "src/app/shared/RelayTitle.svelte"
  import RelayActions from "src/app/shared/RelayActions.svelte"
  import type {DynamicFilter} from "src/engine"
  import {deriveRelay, normalizeRelayUrl, displayRelay, FilterScope} from "src/engine"

  export let url
  export let filter: DynamicFilter = {kinds: noteKinds, scope: FilterScope.FollowsAndNetwork}

  let reviews = []
  let activeTab = "notes"

  url = normalizeRelayUrl(url)

  $: rating = getAvgRating(reviews)

  const relay = deriveRelay(url)
  const tabs = ["notes", "reviews"]
  const setActiveTab = tab => {
    activeTab = tab
  }

  const onReview = batch(1000, chunk => {
    reviews = reviews.concat(chunk)
  })

  document.title = displayRelay($relay)
</script>

<div class="flex items-center justify-between gap-2">
  <RelayTitle relay={$relay} />
  <RelayActions relay={$relay} />
</div>
{#if rating}
  <div class="text-sm">
    <Rating inert value={rating} />
  </div>
{/if}
{#if $relay.info?.description}
  <p>{$relay.info.description}</p>
{/if}
<Tabs {tabs} {activeTab} {setActiveTab} />
{#if activeTab === "reviews"}
  <Feed
    onEvent={onReview}
    filter={{
      kinds: [1986],
      "#l": ["review/relay"],
      "#r": [$relay.url],
    }} />
{:else}
  <Feed skipCache relays={[$relay.url]} {filter} />
{/if}
