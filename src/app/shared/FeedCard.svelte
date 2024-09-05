<script lang="ts">
  import cx from "classnames"
  import {ctx, remove} from "@welshman/lib"
  import {repository, pubkey} from "@welshman/app"
  import {NAMED_BOOKMARKS, toNostrURI, Address} from "@welshman/util"
  import {slide} from "src/util/transition"
  import {boolCtrl} from "src/partials/utils"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Card from "src/partials/Card.svelte"
  import Chip from "src/partials/Chip.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import CopyValueSimple from "src/partials/CopyValueSimple.svelte"
  import PersonCircles from "src/app/shared/PersonCircles.svelte"
  import FeedSummary from "src/app/shared/FeedSummary.svelte"
  import PersonBadgeSmall from "src/app/shared/PersonBadgeSmall.svelte"
  import {readFeed, readList, displayFeed, mapListToFeed, getSingletonValues} from "src/domain"
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
  const naddr = Address.from(address, ctx.app.router.Event(event).getUrls()).toNaddr()
  const feed = address.startsWith(NAMED_BOOKMARKS)
    ? mapListToFeed(readList(event))
    : readFeed(event)

  const toggleFavorite = () => (isFavorite ? removeFeedFavorite(address) : addFeedFavorite(address))

  const loadFeed = () => router.at("notes").cx({feed}).push()

  $: isFavorite = getSingletonValues("a", $userFeedFavorites).includes(address)
  $: favoritedPubkeys = remove(
    $pubkey,
    ($feedFavoritesByAddress.get(address) || []).map(s => s.event.pubkey),
  )
</script>

<Card class="flex gap-3">
  <div class="mt-[6px] hidden sm:block">
    <i class="fa fa-rss fa-2xl" />
  </div>
  <FlexColumn small>
    <div class="flex flex-col justify-between sm:flex-row">
      <span class="flex items-start gap-3">
        <div>
          <Anchor on:click={loadFeed} class="staatliches text-xl">
            <span class:text-neutral-400={!feed.title} class:line-through={deleted}>
              {displayFeed(feed)}
            </span>
          </Anchor>
          {#if deleted}
            <Chip danger small>Deleted</Chip>
          {/if}
        </div>
        <div class="flex gap-1">
          by <PersonBadgeSmall pubkey={feed.event ? feed.event.pubkey : feed.list.event.pubkey} />
        </div>
      </span>
      <slot name="controls">
        <Anchor underline on:click={loadFeed}>Load feed</Anchor>
      </slot>
    </div>
    {#if feed.description}
      <p>{feed.description}</p>
    {/if}
    {#if favoritedPubkeys.length > 0}
      <div class="flex gap-2">
        <span class="text-neutral-300">Bookmarked by</span>
        <PersonCircles class="h-6 w-6" pubkeys={favoritedPubkeys.slice(0, 20)} />
      </div>
    {/if}
    <div
      class="mt-2 flex flex-col items-start justify-between sm:flex-row"
      on:click|stopPropagation>
      <FeedSummary feed={feed.definition} />
      <div class="flex gap-1">
        <div
          class="cursor-pointer p-1 text-neutral-400 transition-colors hover:text-neutral-100"
          on:click={$expandDefinition.toggle}>
          {#if $expandDefinition.enabled}
            <i class="fa fa-angle-down" />
          {:else}
            <i class="fa fa-angle-right" />
          {/if}
        </div>
        <div
          class={cx("p-1 text-neutral-400 transition-colors hover:text-neutral-100", {
            "cursor-pointer": feed.event.pubkey !== $pubkey,
            "pointer-events-none opacity-25": feed.event.pubkey === $pubkey,
          })}
          on:click={toggleFavorite}>
          <i class="fa fa-bookmark" class:text-accent={isFavorite} />
        </div>
        <CopyValueSimple label="Feed address" value={toNostrURI(naddr)} />
      </div>
    </div>
    {#if $expandDefinition.enabled}
      <pre class="overflow-auto rounded bg-neutral-900" transition:slide|local>{JSON.stringify(
          feed.definition,
          null,
          2,
        )}</pre>
    {/if}
  </FlexColumn>
</Card>
