<script lang="ts">
  import {batch, timedelta} from "src/util/misc"
  import {normalizeRelayUrl, getAvgQuality} from "src/util/nostr"
  import Content from "src/partials/Content.svelte"
  import Feed from "src/app/shared/Feed.svelte"
  import Tabs from "src/partials/Tabs.svelte"
  import Rating from "src/partials/Rating.svelte"
  import RelayTitle from "src/app/shared/RelayTitle.svelte"
  import RelayActions from "src/app/shared/RelayActions.svelte"
  import {routing} from "src/system"

  export let url

  let reviews = []
  let activeTab = "reviews"

  url = normalizeRelayUrl(url)

  $: rating = getAvgQuality("review/relay", reviews)

  const relay = routing.getRelay(url)
  const tabs = ["reviews", "notes"]
  const setActiveTab = tab => {
    activeTab = tab
  }

  const onReview = batch(1000, chunk => {
    reviews = reviews.concat(chunk)
  })

  document.title = routing.displayRelay(relay)
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
  {#if relay.meta.description}
    <p>{relay.meta.description}</p>
  {/if}
  <Tabs borderClass="border-gray-6" {tabs} {activeTab} {setActiveTab} />
  {#if activeTab === "reviews"}
    <Feed
      invertColors
      onEvent={onReview}
      delta={timedelta(365, "days")}
      filter={{
        kinds: [1985],
        "#l": ["review/relay"],
        "#L": ["social.coracle.ontology"],
        "#r": [relay.url],
      }} />
  {:else}
    <Feed invertColors relays={[relay]} filter={{kinds: [1]}} />
  {/if}
</Content>
