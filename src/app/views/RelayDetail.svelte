<script lang="ts">
  import {batch} from "hurdak"
  import {makeRelayFeed, feedFromFilter} from "@welshman/feeds"
  import {deriveRelay} from "@welshman/app"
  import {getAvgRating} from "src/util/nostr"
  import Feed from "src/app/shared/Feed.svelte"
  import Tabs from "src/partials/Tabs.svelte"
  import Rating from "src/partials/Rating.svelte"
  import RelayTitle from "src/app/shared/RelayTitle.svelte"
  import RelayActions from "src/app/shared/RelayActions.svelte"
  import {makeFeed, normalizeRelayUrl, displayRelayUrl} from "src/domain"

  export let url

  const relay = deriveRelay(url)
  const tabs = ["notes", "reviews"]

  const notesFeed = makeFeed({
    definition: makeRelayFeed(url),
  })

  const reviewsFeed = makeFeed({
    definition: feedFromFilter({
      kinds: [1986],
      "#l": ["review/relay"],
      "#r": [url],
    }),
  })

  const setActiveTab = tab => {
    activeTab = tab
  }

  const onReview = batch(1000, chunk => {
    reviews = reviews.concat(chunk)
  })

  let reviews = []
  let activeTab = "notes"

  $: url = normalizeRelayUrl(url)
  $: rating = getAvgRating(reviews)
  $: console.log($relay)

  document.title = displayRelayUrl(url)
</script>

<div class="flex items-center justify-between gap-2">
  <RelayTitle {url} />
  <RelayActions {url} />
</div>
{#if rating}
  <div class="text-sm">
    <Rating inert value={rating} />
  </div>
{/if}
{#if $relay.profile?.description}
  <p>{$relay.profile.description}</p>
{/if}
<Tabs {tabs} {activeTab} {setActiveTab} />
{#if activeTab === "reviews"}
  <Feed onEvent={onReview} feed={reviewsFeed} />
{:else}
  <Feed feed={notesFeed} />
{/if}
