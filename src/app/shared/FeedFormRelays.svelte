<script lang="ts">
  import {flatten, partition} from "@welshman/lib"
  import {makeRelayFeed, getFeedArgs, isRelayFeed} from "@welshman/feeds"
  import type {IntersectionFeed} from "@welshman/feeds"
  import FeedFormFilters from "src/app/shared/FeedFormFilters.svelte"

  export let feed: IntersectionFeed
  export let onChange

  if (!getFeedArgs(feed).some(isRelayFeed)) {
    onChange([...feed, makeRelayFeed()])
  }

  $: sorted = [feed[0], ...flatten(partition(isRelayFeed, getFeedArgs(feed)))]
</script>

<FeedFormFilters feed={sorted} {onChange} />
