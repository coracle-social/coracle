<script type="ts">
  import {getAddress} from "@welshman/util"
  import Subheading from "src/partials/Subheading.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Card from "src/partials/Card.svelte"
  import FeedSummary from "src/app/shared/FeedSummary.svelte"
  import {router} from "src/app/util/router"
  import {readFeed} from "src/domain"
  import {userFeeds} from "src/engine"

  const createFeed = () => router.at("feeds/create").open()

  const editFeed = address => router.at("feeds").of(address).open()
</script>

<div class="flex items-center justify-between">
  <Subheading>Your Feeds</Subheading>
  <Anchor button accent on:click={createFeed}>
    <i class="fa fa-plus" /> Feed
  </Anchor>
</div>
{#each $userFeeds as event (getAddress(event))}
  {@const address = getAddress(event)}
  {@const {name, description, definition} = readFeed(event)}
  <Card>
    <FlexColumn>
      <div class="flex items-center justify-between">
        <span class="staatliches flex items-center gap-3 text-xl">
          <i class="fa fa-rss" />
          {#if name}
            {name}
          {:else}
            <span class="text-neutral-500">No name</span>
          {/if}
        </span>
        <Anchor on:click={() => editFeed(address)}>
          <i class="fa fa-edit" /> Edit
        </Anchor>
      </div>
      {#if description}
        <p>{description}</p>
      {/if}
      <FeedSummary feed={definition} />
    </FlexColumn>
  </Card>
{:else}
  <p class="text-center py-12">You don't have any feeds yet.</p>
{/each}
