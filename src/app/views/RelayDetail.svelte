<script lang="ts">
  import {displayRelayUrl, normalizeRelayUrl} from "@welshman/util"
  import {makeRelayFeed, feedFromFilter} from "@welshman/feeds"
  import {deriveEvents} from "@welshman/store"
  import {deriveRelay, repository} from "@welshman/app"
  import {getAvgRating} from "src/util/nostr"
  import Feed from "src/app/shared/Feed.svelte"
  import Tabs from "src/partials/Tabs.svelte"
  import Rating from "src/partials/Rating.svelte"
  import RelayTitle from "src/app/shared/RelayTitle.svelte"
  import RelayActions from "src/app/shared/RelayActions.svelte"
  import {makeFeed} from "src/domain"

  export let url

  const relay = deriveRelay(url)
  const tabs = ["notes", "reviews"]
  const filter = {kinds: [1986], "#l": ["review/relay"], "#r": [url]}
  const reviews = deriveEvents(repository, {filters: [filter]})

  const notesFeed = makeFeed({
    definition: makeRelayFeed(url),
  })

  const reviewsFeed = makeFeed({
    definition: feedFromFilter(filter),
  })

  const setActiveTab = tab => {
    activeTab = tab
  }

  let activeTab = "notes"

  $: url = normalizeRelayUrl(url)
  $: rating = getAvgRating($reviews)

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
{#if $relay?.profile?.description}
  <p>{$relay?.profile.description}</p>
{/if}
<Tabs {tabs} {activeTab} {setActiveTab} />
{#if activeTab === "reviews"}
  <Feed feed={reviewsFeed} />
{:else}
  <Feed feed={notesFeed} />
{/if}
