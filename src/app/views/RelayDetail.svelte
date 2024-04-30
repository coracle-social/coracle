<script lang="ts">
  import {batch} from "hurdak"
  import {wotFeed, relayFeed, intersectionFeed, feedFromFilter} from "@welshman/feeds"
  import type {Feed as TFeed} from "@welshman/feeds"
  import {getAvgRating} from "src/util/nostr"
  import Feed from "src/app/shared/Feed.svelte"
  import Tabs from "src/partials/Tabs.svelte"
  import Rating from "src/partials/Rating.svelte"
  import RelayTitle from "src/app/shared/RelayTitle.svelte"
  import RelayActions from "src/app/shared/RelayActions.svelte"
  import {deriveRelay, normalizeRelayUrl, displayRelay, getMinWot} from "src/engine"

  export let url
  export let feed: TFeed = wotFeed({min: getMinWot()})

  let reviews = []
  let activeTab = "notes"

  $: url = normalizeRelayUrl(url)
  $: feed = intersectionFeed(relayFeed(url), feed)
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
    feed={feedFromFilter({
      kinds: [1986],
      "#l": ["review/relay"],
      "#r": [$relay.url],
    })} />
{:else}
  <Feed skipCache {feed} />
{/if}
