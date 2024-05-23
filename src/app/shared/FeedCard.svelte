<script lang="ts">
  import {NAMED_BOOKMARKS, toNostrURI, Address} from "@welshman/util"
  import {slide} from "src/util/transition"
  import {boolCtrl} from "src/partials/utils"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Card from "src/partials/Card.svelte"
  import Chip from "src/partials/Chip.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import CopyValueSimple from "src/partials/CopyValueSimple.svelte"
  import FeedSummary from "src/app/shared/FeedSummary.svelte"
  import PersonBadgeSmall from "src/app/shared/PersonBadgeSmall.svelte"
  import {readFeed, readList, displayFeed, mapListToFeed} from "src/domain"
  import {repository} from "src/engine"
  import {globalFeed} from "src/app/state"
  import {router} from "src/app/util"

  export let address

  const expandDefinition = boolCtrl()
  const event = repository.getEvent(address)
  const deleted = repository.isDeleted(event)
  const feed = address.startsWith(NAMED_BOOKMARKS)
    ? mapListToFeed(readList(event))
    : readFeed(event)

  const loadFeed = () => {
    globalFeed.set(feed)
    router.at("notes").push()
  }
</script>

<Card class="flex gap-3">
  <div class="mt-[6px]">
    <i class="fa fa-rss fa-2xl" />
  </div>
  <FlexColumn small>
    <div class="flex justify-between">
      <span class="flex items-start gap-3">
        <div>
          <span
            class="staatliches text-xl"
            class:text-neutral-400={!feed.title}
            class:line-through={deleted}>
            {displayFeed(feed)}
          </span>
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
    <div class="mt-2 flex items-start justify-between">
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
        <CopyValueSimple label="Feed address" value={toNostrURI(Address.from(address).toNaddr())} />
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
