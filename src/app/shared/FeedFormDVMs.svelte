<script lang="ts">
  import {flatten, partition} from "@welshman/lib"
  import {FeedType, getFeedArgs, isDVMFeed} from "@welshman/feeds"
  import FeedFormFilters from "src/app/shared/FeedFormFilters.svelte"

  export let feed
  export let onChange

  if (!getFeedArgs(feed).some(isDVMFeed)) {
    onChange([...feed, [FeedType.DVM, {kind: 5300}]])
  }

  $: sorted = [feed[0], ...flatten(partition(isDVMFeed, getFeedArgs(feed)))]
</script>

<FeedFormFilters feed={sorted} {onChange} />
