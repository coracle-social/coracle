<script lang="ts">
  import {partition, identity} from "ramda"
  import {FeedType, Scope, getFeedArgs, isAuthorFeed, isScopeFeed} from "@welshman/feeds"
  import FeedFormFilters from "src/app/shared/FeedFormFilters.svelte"

  export let feed
  export let onChange

  const isPeopleFeed = f => isAuthorFeed(f) || isScopeFeed(f)

  if (!getFeedArgs(feed).some(isPeopleFeed)) {
    onChange([...feed, [FeedType.Scope, Scope.Follows]])
  }

  $: sorted = [feed[0], ...partition(isPeopleFeed, feed.slice(1)).flatMap(identity)]
</script>

<FeedFormFilters feed={sorted} {onChange} />
