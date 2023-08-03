<script lang="ts">
  import {batch} from "hurdak"
  import {normalizeRelayUrl, getAvgQuality} from "src/util/nostr"
  import Content from "src/partials/Content.svelte"
  import Feed from "src/app/shared/Feed.svelte"
  import Tabs from "src/partials/Tabs.svelte"
  import Rating from "src/partials/Rating.svelte"
  import RelayTitle from "src/app/shared/RelayTitle.svelte"
  import RelayActions from "src/app/shared/RelayActions.svelte"
  import {Nip65} from "src/app/engine"

  export let url

  let reviews = []
  let activeTab = "reviews"

  url = normalizeRelayUrl(url)

  $: rating = getAvgQuality("review/relay", reviews)

  const relay = Nip65.getRelay(url)
  const tabs = ["reviews", "notes"]
  const setActiveTab = tab => {
    activeTab = tab
  }

  const onReview = batch(1000, chunk => {
    reviews = reviews.concat(chunk)
  })

  document.title = Nip65.displayRelay(relay)
</script>

<Content>
  <div class="flex items-center justify-between gap-2">
    <RelayTitle {relay} />
    <RelayActions {relay} />
  </div>
  {#if rating}
    <div class="text-sm">
      <Rating inert value={rating} />
    </div>
  {/if}
  {#if relay.info?.description}
    <p>{relay.info.description}</p>
  {/if}
  <Tabs borderClass="border-gray-6" {tabs} {activeTab} {setActiveTab} />
  {#if activeTab === "reviews"}
    <Feed
      invertColors
      onEvent={onReview}
      filter={{kinds: [1985], "#l": ["review/relay"], "#r": [relay.url]}} />
  {:else}
    <Feed invertColors relays={[relay.url]} filter={{kinds: [1]}} />
  {/if}
</Content>
