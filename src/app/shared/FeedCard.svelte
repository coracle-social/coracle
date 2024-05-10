<script type="ts">
  import {Kind} from '@welshman/util'
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Card from "src/partials/Card.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import FeedSummary from "src/app/shared/FeedSummary.svelte"
  import {readFeed, displayFeed, listAsFeed} from "src/domain"
  import {repository, lists} from 'src/engine'
  import {feed as globalFeed} from 'src/app/state'
  import {router} from 'src/app/util'

  export let address

  const feed = address.startsWith(Kind.ListBookmarks)
    ? listAsFeed(lists.key(address).get())
    : readFeed(repository.getEvent(address))

  const loadFeed = () => {
    globalFeed.set(feed)
    router.at('notes').push()
  }
</script>

<Card>
  <FlexColumn>
    <div class="flex items-center justify-between">
      <span class="staatliches flex items-center gap-3 text-xl">
        <i class="fa fa-rss" />
        <Anchor on:click={loadFeed} class={feed.name ? "" : "text-neutral-500"}>
          {displayFeed(feed)}
        </Anchor>
      </span>
      <slot name="controls" />
    </div>
    {#if feed.description}
      <p>{feed.description}</p>
    {/if}
    <FeedSummary feed={feed.definition} />
  </FlexColumn>
</Card>
