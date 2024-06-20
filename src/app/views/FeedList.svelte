<script lang="ts">
  import {sortBy, uniqBy} from "@welshman/lib"
  import {getAddress} from "@welshman/util"
  import {onMount} from "svelte"
  import {createScroller} from "src/util/misc"
  import {fly} from "src/util/transition"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Input from "src/partials/Input.svelte"
  import FeedCard from "src/app/shared/FeedCard.svelte"
  import {router} from "src/app/util/router"
  import {displayFeed} from "src/domain"
  import {
    pubkey,
    userFeeds,
    feedSearch,
    userListFeeds,
    loadPubkeyFeeds,
    userFavoritedFeeds,
    userFollows,
  } from "src/engine"

  const feeds = uniqBy(
    feed => getAddress(feed.event),
    sortBy(displayFeed, [...$userFeeds, ...$userListFeeds, ...$userFavoritedFeeds]),
  )

  const createFeed = () => router.at("feeds/create").open()

  const editFeed = address => router.at("feeds").of(address).open()

  const loadMore = async () => {
    limit += 20
  }

  let q = ""
  let limit = 20
  let element

  loadPubkeyFeeds(Array.from($userFollows))

  onMount(() => {
    const scroller = createScroller(loadMore, {element})

    return () => scroller.stop()
  })
</script>

<FlexColumn bind:element>
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-2">
      <i class="fa fa-rss fa-lg" />
      <h2 class="staatliches text-2xl">Your feeds</h2>
    </div>
    <Anchor button accent on:click={createFeed}>
      <i class="fa fa-plus" /> Feed
    </Anchor>
  </div>
  {#each feeds as feed (getAddress(feed.event))}
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
  {#each $userListFeeds as feed (getAddress(feed.list.event))}
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
    <p class="py-12 text-center">You don't have any feeds yet.</p>
  {/if}
  <div class="flex items-center gap-2">
    <i class="fa fa-circle-nodes fa-lg" />
    <h2 class="staatliches text-2xl">Other feeds</h2>
  </div>
  <p>Below are feeds created by people in your network.</p>
  <Input bind:value={q} placeholder="Search feeds">
    <i slot="before" class="fa-solid fa-search" />
  </Input>
  {#each $feedSearch
    .searchValues(q)
    .filter(address => !address.includes($pubkey))
    .slice(0, limit) as address (address)}
    <FeedCard {address} />
  {/each}
</FlexColumn>
