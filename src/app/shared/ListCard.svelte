<script lang="ts">
  import {first, noop, formatTimestamp} from "@welshman/lib"
  import {matchTags, tagSpec, toNostrURI, Address} from "@welshman/util"
  import type {TrustedEvent} from "@welshman/util"
  import {defaultTagFeedMappings} from "@welshman/feeds"
  import {Events} from "@welshman/app"
  import {fromApp} from "src/engine/core"
  import {slide} from "src/util/transition"
  import {boolCtrl} from "src/partials/utils"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Chip from "src/partials/Chip.svelte"
  import Button from "src/partials/Button.svelte"
  import CopyValueSimple from "src/partials/CopyValueSimple.svelte"
  import PersonBadgeSmall from "src/app/shared/PersonBadgeSmall.svelte"
  import {readUserList, displayUserList, mapListToFeed} from "src/domain"
  import {router} from "src/app/util"
  import {quantify} from "src/util/misc"

  export let address
  export let inert = false

  const expandTags = boolCtrl()
  const tagTypes = defaultTagFeedMappings.map(first) as string[]
  const eventStore = fromApp($app => $app.use(Events).one(address).$)

  const deriveDeleted = (event: TrustedEvent) =>
    fromApp($app => $app.use(Events).isDeleted(event).$)

  const loadFeed = () => {
    if (!inert) {
      router
        .at("notes")
        .cx({feed: mapListToFeed(list)})
        .push()
    }
  }

  let list

  $: event = $eventStore
  $: if (event) {
    readUserList(event).then(userList => {
      list = userList
    }, noop)
  }
  $: deleted = event && deriveDeleted(event)
</script>

{#if list}
  <div class="flex justify-end text-xs">
    {formatTimestamp(event.created_at)}
  </div>
  <div class="flex gap-3">
    <div class="mt-[6px]">
      <i class="fa fa-list fa-2xl" />
    </div>
    <FlexColumn small>
      <div class="flex items-center justify-between">
        <span class="flex items-center gap-3">
          <div>
            <span
              class="staatliches text-xl"
              class:text-neutral-400={!list.title}
              class:line-through={$deleted}>
              {displayUserList(list)}
            </span>
            {#if $deleted}
              <Chip danger small>Deleted</Chip>
            {/if}
          </div>
          <div class="flex gap-1">
            by <PersonBadgeSmall pubkey={list.event.pubkey} />
          </div>
        </span>
        <slot name="controls">
          <Button class="underline" on:click={loadFeed}>Load feed</Button>
        </slot>
      </div>
      {#if list.description}
        <p>{list.description}</p>
      {/if}
      <div class="flex items-center justify-between">
        {quantify(matchTags(tagSpec(tagTypes), event.tags).length, "item")}
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
  </div>
{/if}
