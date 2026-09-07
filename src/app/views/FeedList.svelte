<script lang="ts">
  import {noop, sortBy, uniq, flatten, batch, uniqBy} from "@welshman/lib"
  import {
    FEED,
    FEEDS,
    NAMED_BOOKMARKS,
    addressTags,
    getAddress,
    getIdFilters,
    outbox,
    tagValues,
    Address,
  } from "@welshman/util"
  import type {TrustedEvent} from "@welshman/util"
  import {app, resolveRelays} from "src/engine/core"
  import {onMount} from "svelte"
  import {createScroller} from "src/util/misc"
  import {fly} from "src/util/transition"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Button from "src/partials/Button.svelte"
  import Input from "src/partials/Input.svelte"
  import Card from "src/partials/Card.svelte"
  import FeedListItem from "src/app/shared/FeedListItem.svelte"
  import {router} from "src/app/util/router"
  import {displayFeed} from "src/domain"
  import {
    myLoad,
    userFeeds,
    feedSearch,
    userListFeeds,
    userFavoritedFeeds,
    userFollows,
    addSinceToFilter,
  } from "src/engine"

  const authors = Array.from($userFollows)

  const createFeed = () => router.at("feeds/create").open()

  const editFeed = address => router.at("feeds").of(address).open()

  const loadFeeds = batch(300, (addresseses: string[][]) => {
    const addresses = flatten(addresseses).filter(a => !$app.repository.getEvent(a))
    const pubkeys = uniq(addresses.map(a => Address.from(a).pubkey))

    if (addresses.length > 0) {
      // Relay selection is asynchronous now, so this fires a tick after the batch flushes
      resolveRelays(pubkeys.map(pk => outbox(pk)))
        .then(relays => myLoad({skipCache: true, filters: getIdFilters(addresses), relays}))
        .catch(noop)
    }
  })

  const onRepositoryUpdate = ({added}: {added: TrustedEvent[]}) =>
    loadFeeds(added.filter(e => e.kind === FEEDS).flatMap(e => tagValues(addressTags("a"), e.tags)))

  const loadMore = async () => {
    limit += 20
  }

  let q = ""
  let limit = 20
  let initialAddrs = new Set()
  let element

  $: feeds = uniqBy(
    feed => getAddress(feed.event),
    sortBy(displayFeed, [...$userFeeds, ...$userListFeeds, ...$userFavoritedFeeds]),
  )

  $: otherFeeds = $feedSearch
    .searchValues(q)
    .filter(address => !initialAddrs.has(address))
    .slice(0, limit)

  resolveRelays(authors.map(pk => outbox(pk)))
    .then(relays =>
      myLoad({
        skipCache: true,
        relays,
        filters: [addSinceToFilter({kinds: [FEED, FEEDS, NAMED_BOOKMARKS], authors})],
      }),
    )
    .catch(noop)

  onMount(() => {
    const scroller = createScroller(loadMore, {element})

    initialAddrs = new Set(feeds.map(feed => getAddress(feed.event)))
    $app.repository.on("update", onRepositoryUpdate)

    return () => {
      scroller.stop()
      $app.repository.off("update", onRepositoryUpdate)
    }
  })
</script>

<FlexColumn bind:element>
  <div class="flex items-center justify-between gap-4">
    <div class="flex items-center gap-3">
      <i class="fa fa-rss fa-lg text-accent" />
      <h2 class="staatliches text-2xl">Your feeds</h2>
    </div>
    <Button class="btn btn-accent" on:click={createFeed}>
      <i class="fa fa-plus" /> Feed
    </Button>
  </div>
  {#each feeds as feed (getAddress(feed.event))}
    {@const address = getAddress(feed.event)}
    <div in:fly={{y: 20}}>
      <FeedListItem {address}>
        <Button slot="controls" class="btn" on:click={() => editFeed(address)}>
          <i class="fa fa-edit" /> Edit
        </Button>
      </FeedListItem>
    </div>
  {/each}
  {#if feeds.length === 0}
    <Card>
      <div class="flex flex-col items-center gap-2 py-8 text-center text-neutral-400">
        <i class="fa fa-rss fa-2x" />
        <p>You don't have any feeds yet.</p>
        <Button class="btn btn-low mt-2" on:click={createFeed}>
          <i class="fa fa-plus" /> Create a feed
        </Button>
      </div>
    </Card>
  {/if}
  <div class="mt-4 flex flex-col gap-1">
    <div class="flex items-center gap-3">
      <i class="fa fa-circle-nodes fa-lg text-accent" />
      <h2 class="staatliches text-2xl">Other feeds</h2>
    </div>
    <p class="text-sm text-neutral-400">Feeds created by people in your network.</p>
  </div>
  <Input bind:value={q} placeholder="Search feeds">
    <i slot="before" class="fa-solid fa-search" />
  </Input>
  {#each otherFeeds as address (address)}
    <div in:fly={{y: 20}}>
      <FeedListItem {address} />
    </div>
  {/each}
  {#if q && otherFeeds.length === 0}
    <p class="py-8 text-center text-neutral-400">No feeds matching "{q}".</p>
  {/if}
</FlexColumn>
