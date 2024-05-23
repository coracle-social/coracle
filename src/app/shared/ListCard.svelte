<script lang="ts">
  import {quantify} from "hurdak"
  import {first} from "@welshman/lib"
  import {Tags, toNostrURI, Address} from "@welshman/util"
  import {defaultTagFeedMappings} from "@welshman/feeds"
  import {slide} from "src/util/transition"
  import {boolCtrl} from "src/partials/utils"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Card from "src/partials/Card.svelte"
  import Chip from "src/partials/Chip.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import CopyValueSimple from "src/partials/CopyValueSimple.svelte"
  import PersonBadgeSmall from "src/app/shared/PersonBadgeSmall.svelte"
  import {readList, displayList, mapListToFeed} from "src/domain"
  import {repository} from "src/engine"
  import {globalFeed} from "src/app/state"
  import {router} from "src/app/util"

  export let address
  export let inert = false

  const expandTags = boolCtrl()
  const tagTypes = defaultTagFeedMappings.map(first) as string[]
  const event = repository.getEvent(address)
  const deleted = repository.isDeleted(event)
  const tags = Tags.fromEvent(event)
  const list = readList(event)

  const loadFeed = () => {
    if (!inert) {
      globalFeed.set(mapListToFeed(list))
      router.at("notes").push()
    }
  }
</script>

<Card class="flex gap-3">
  <div class="mt-[6px]">
    <i class="fa fa-list fa-2xl" />
  </div>
  <FlexColumn small>
    <div class="flex justify-between">
      <span class="flex items-start gap-3">
        <div>
          <span
            class="staatliches text-xl"
            class:text-neutral-400={!list.title}
            class:line-through={deleted}>
            {displayList(list)}
          </span>
          {#if deleted}
            <Chip danger small>Deleted</Chip>
          {/if}
        </div>
        <div class="flex gap-1">
          by <PersonBadgeSmall pubkey={list.event.pubkey} />
        </div>
      </span>
      <slot name="controls">
        <Anchor underline on:click={loadFeed}>Load feed</Anchor>
      </slot>
    </div>
    {#if list.description}
      <p>{list.description}</p>
    {/if}
    <div class="flex items-center justify-between">
      {quantify(tags.filterByKey(tagTypes).count(), "item")}
      <div class="flex gap-1">
        <div
          class="cursor-pointer p-1 text-neutral-400 transition-colors hover:text-neutral-100"
          on:click={$expandTags.toggle}>
          {#if $expandTags.enabled}
            <i class="fa fa-angle-down" />
          {:else}
            <i class="fa fa-angle-right" />
          {/if}
        </div>
        <CopyValueSimple
          label="List address"
          value={toNostrURI(Address.from(address).toNaddr())}
          class="text-neutral-400" />
      </div>
    </div>
    {#if $expandTags.enabled}
      <pre class="overflow-auto rounded bg-neutral-900" transition:slide|local>{JSON.stringify(
          event.tags,
          null,
          2,
        )}</pre>
    {/if}
  </FlexColumn>
</Card>
