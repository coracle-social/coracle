<script lang="ts">
  import {NAMED_BOOKMARKS} from "@welshman/util"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Card from "src/partials/Card.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import FeedSummary from "src/app/shared/FeedSummary.svelte"
  import {readFeed, readList, displayFeed, mapListToFeed} from "src/domain"
  import {repository} from "src/engine"
  import {globalFeed} from "src/app/state"
  import {router} from "src/app/util"

  export let address

  const event = repository.getEvent(address)
  const feed = address.startsWith(NAMED_BOOKMARKS)
    ? mapListToFeed(readList(event))
    : readFeed(event)

  const loadFeed = () => {
    globalFeed.set(feed)
    router.at("notes").push()
  }
</script>

<Card>
  <FlexColumn>
    <div class="flex items-center justify-between">
      <span class="staatliches flex items-center gap-3 text-xl">
        <i class="fa fa-rss" />
        <Anchor on:click={loadFeed} class={feed.title ? "" : "text-neutral-500"}>
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
