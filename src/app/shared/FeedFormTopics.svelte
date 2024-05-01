<script lang="ts">
  import {partition, identity} from "ramda"
  import {FeedType, getFeedArgs, isTagFeed} from "@welshman/feeds"
  import FeedFormFilters from "src/app/shared/FeedFormFilters.svelte"

  export let feed
  export let onChange

  const isTopicFeed = f => isTagFeed(f) && f[1] === "#t"

  if (!getFeedArgs(feed).some(isTopicFeed)) {
    onChange([...feed, [FeedType.Tag, "#t"]])
  }

  $: sorted = [feed[0], ...partition(isTopicFeed, feed.slice(1)).flatMap(identity)]
</script>

<FeedFormFilters feed={sorted} {onChange} />
