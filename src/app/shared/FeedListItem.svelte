<script lang="ts">
  import cx from "classnames"
  import {remove, formatTimestamp} from "@welshman/lib"
  import {Router} from "@welshman/router"
  import {repository, pubkey} from "@welshman/app"
  import {
    NAMED_BOOKMARKS,
    toNostrURI,
    Address,
    getListTags,
    getAddressTagValues,
  } from "@welshman/util"
  import {slide} from "src/util/transition"
  import {boolCtrl} from "src/partials/utils"
  import Card from "src/partials/Card.svelte"
  import Chip from "src/partials/Chip.svelte"
  import CopyValueSimple from "src/partials/CopyValueSimple.svelte"
  import PersonCircles from "src/app/shared/PersonCircles.svelte"
  import FeedSummary from "src/app/shared/FeedSummary.svelte"
  import PersonBadgeSmall from "src/app/shared/PersonBadgeSmall.svelte"
  import {readFeed, readUserList, displayFeed, mapListToFeed} from "src/domain"
  import {
    addFeedFavorite,
    removeFeedFavorite,
    userFeedFavorites,
    feedFavoritesByAddress,
  } from "src/engine"
  import {router} from "src/app/util"

  export let address

  const expandDefinition = boolCtrl()
  const event = repository.getEvent(address)
  const deleted = repository.isDeleted(event)
  const naddr = Address.from(address, Router.get().Event(event).getUrls()).toNaddr()
  const feed = address.startsWith(NAMED_BOOKMARKS)
    ? mapListToFeed(readUserList(event))
    : readFeed(event)
  const feedPubkey = feed.event ? feed.event.pubkey : feed.list.event.pubkey

  const toggleFavorite = () => (isFavorite ? removeFeedFavorite(address) : addFeedFavorite(address))

  const loadFeed = () => router.at("notes").cx({feed}).push()

  $: isFavorite = getAddressTagValues(getListTags($userFeedFavorites)).includes(address)
  $: favoritedPubkeys = remove(
    $pubkey,
    ($feedFavoritesByAddress.get(address) || []).map(s => s.event.pubkey),
  )
  $: canFavorite = feedPubkey !== $pubkey
</script>

<Card interactive on:click={loadFeed}>
  <div class="flex flex-col gap-3">
    <div class="flex items-start justify-between gap-4">
      <div class="flex min-w-0 flex-col">
        <div class="flex items-center gap-2">
            <span
              class="staatliches truncate text-2xl"
              class:text-neutral-400={!feed.title}
              class:line-through={deleted}>
              {displayFeed(feed)}
            </span>
            {#if deleted}
              <Chip danger small>Deleted</Chip>
            {/if}
          </div>
          <div class="flex items-center gap-1 text-sm text-neutral-400" on:click|stopPropagation>
            <span>by</span>
            <PersonBadgeSmall pubkey={feedPubkey} />
          </div>
      </div>
      {#if $$slots.controls}
        <div class="shrink-0" on:click|stopPropagation>
          <slot name="controls" />
        </div>
      {/if}
    </div>
    {#if feed.description}
      <p class="text-neutral-300">{feed.description}</p>
    {/if}
    <div on:click|stopPropagation>
      <FeedSummary feed={feed.definition} />
    </div>
    {#if favoritedPubkeys.length > 0}
      <div class="flex items-center gap-2 text-sm text-neutral-400" on:click|stopPropagation>
        <span>Bookmarked by</span>
        <PersonCircles class="h-6 w-6" pubkeys={favoritedPubkeys.slice(0, 20)} />
      </div>
    {/if}
    <div class="flex items-center justify-between text-sm text-neutral-400">
      <span class="flex items-center gap-1">
        <i class="fa fa-clock" />
        {formatTimestamp(event.created_at)}
      </span>
      <div class="flex items-center gap-1" on:click|stopPropagation>
        <button
          class="cursor-pointer p-1 text-neutral-400 transition-colors hover:text-neutral-100"
          title="Show raw definition"
          on:click={$expandDefinition.toggle}>
          <i class="fa fa-code" class:text-neutral-100={$expandDefinition.enabled} />
        </button>
        <button
          class={cx("p-1 transition-colors", {
            "cursor-pointer text-neutral-400 hover:text-neutral-100": canFavorite,
            "pointer-events-none opacity-25": !canFavorite,
          })}
          title={isFavorite ? "Remove bookmark" : "Bookmark feed"}
          on:click={toggleFavorite}>
          <i class="fa fa-bookmark" class:text-accent={isFavorite} />
        </button>
        <CopyValueSimple label="Feed address" value={toNostrURI(naddr)} />
      </div>
    </div>
    {#if $expandDefinition.enabled}
      <pre
        class="overflow-auto rounded bg-neutral-900 p-3 text-xs"
        on:click|stopPropagation
        transition:slide|local>{JSON.stringify(feed.definition, null, 2)}</pre>
    {/if}
  </div>
</Card>
