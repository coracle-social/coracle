<script lang="ts">
  import {getAddress} from "@welshman/util"
  import {fly} from "src/util/transition"
  import Subheading from "src/partials/Subheading.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import FeedCard from "src/app/shared/FeedCard.svelte"
  import {router} from "src/app/util/router"
  import {userFeeds, userListFeeds} from "src/engine"

  const createFeed = () => router.at("feeds/create").open()

  const editFeed = address => router.at("feeds").of(address).open()
</script>

<div class="flex items-center justify-between">
  <Subheading>Your Feeds</Subheading>
  <Anchor button accent on:click={createFeed}>
    <i class="fa fa-plus" /> Feed
  </Anchor>
</div>
{#each $userFeeds as feed}
  {@const address = getAddress(feed.event)}
  <div in:fly={{y: 20}}>
    <FeedCard {address}>
      <div slot="controls">
        <Anchor on:click={() => editFeed(address)}>
          <i class="fa fa-edit" /> Edit
        </Anchor>
      </div>
    </FeedCard>
  </div>
{/each}
{#each $userListFeeds as feed}
  {@const address = getAddress(feed.list.event)}
  <div in:fly={{y: 20}}>
    <FeedCard {address}>
      <div slot="controls">
        <Anchor on:click={() => editFeed(address)}>
          <i class="fa fa-edit" /> Edit
        </Anchor>
      </div>
    </FeedCard>
  </div>
{/each}
{#if $userFeeds.length === 0 && $userListFeeds.length === 0}
  <p class="py-12 text-center">No feeds found.</p>
{/if}
