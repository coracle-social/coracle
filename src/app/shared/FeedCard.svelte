<script type="ts">
  import {Kind} from '@welshman/util'
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Card from "src/partials/Card.svelte"
  import FeedSummary from "src/app/shared/FeedSummary.svelte"
  import {readFeed, displayFeed, listAsFeed} from "src/domain"
  import {repository, lists} from 'src/engine'

  export let address

  const feed = address.startsWith(Kind.ListBookmarks)
    ? listAsFeed(lists.key(address).get())
    : readFeed(repository.getEvent(address))
</script>

<Card>
  <FlexColumn>
    <div class="flex items-center justify-between">
      <span class="staatliches flex items-center gap-3 text-xl">
        <i class="fa fa-rss" />
        <span class:text-neutral-500={!feed.name}>
          {displayFeed(feed)}
        </span>
      </span>
      <slot name="controls" />
    </div>
    {#if feed.description}
      <p>{feed.description}</p>
    {/if}
    <FeedSummary feed={feed.definition} />
  </FlexColumn>
</Card>
