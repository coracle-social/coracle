<script lang="ts">
  import {first, formatTimestamp} from "@welshman/lib"
  import {getTags, toNostrURI, Address} from "@welshman/util"
  import {defaultTagFeedMappings} from "@welshman/feeds"
  import {repository} from "@welshman/app"
  import {slide} from "src/util/transition"
  import {boolCtrl} from "src/partials/utils"
  import Card from "src/partials/Card.svelte"
  import Chip from "src/partials/Chip.svelte"
  import CopyValueSimple from "src/partials/CopyValueSimple.svelte"
  import PersonBadgeSmall from "src/app/shared/PersonBadgeSmall.svelte"
  import {readUserList, displayUserList, mapListToFeed} from "src/domain"
  import {router} from "src/app/util"
  import {quantify} from "src/util/misc"

  export let address
  export let inert = false

  const expandTags = boolCtrl()
  const tagTypes = defaultTagFeedMappings.map(first) as string[]
  const event = repository.getEvent(address)
  const deleted = repository.isDeleted(event)
  const list = readUserList(event)
  const itemCount = getTags(tagTypes, event.tags).length

  const loadFeed = () => {
    if (!inert) {
      router
        .at("notes")
        .cx({feed: mapListToFeed(list)})
        .push()
    }
  }
</script>

<Card interactive={!inert} on:click={loadFeed}>
  <div class="flex flex-col gap-3">
    <div class="flex items-start justify-between gap-4">
      <div class="flex min-w-0 flex-col">
        <div class="flex items-center gap-2">
            <span
              class="staatliches truncate text-2xl"
              class:text-neutral-400={!list.title}
              class:line-through={deleted}>
              {displayUserList(list)}
            </span>
            {#if deleted}
              <Chip danger small>Deleted</Chip>
            {/if}
          </div>
          <div class="flex items-center gap-1 text-sm text-neutral-400" on:click|stopPropagation>
            <span>by</span>
            <PersonBadgeSmall pubkey={list.event.pubkey} />
          </div>
      </div>
      {#if $$slots.controls}
        <div class="shrink-0" on:click|stopPropagation>
          <slot name="controls" />
        </div>
      {/if}
    </div>
    {#if list.description}
      <p class="text-neutral-300">{list.description}</p>
    {/if}
    <div class="flex items-center justify-between text-sm text-neutral-400">
      <div class="flex items-center gap-4">
        <span class="flex items-center gap-1">
          <i class="fa fa-hashtag" />
          {quantify(itemCount, "item")}
        </span>
        <span class="flex items-center gap-1">
          <i class="fa fa-clock" />
          {formatTimestamp(event.created_at)}
        </span>
      </div>
      <div class="flex items-center gap-1" on:click|stopPropagation>
        <button
          class="cursor-pointer p-1 text-neutral-400 transition-colors hover:text-neutral-100"
          title="Show raw tags"
          on:click={$expandTags.toggle}>
          <i class="fa fa-code" class:text-neutral-100={$expandTags.enabled} />
        </button>
        <CopyValueSimple label="List address" value={toNostrURI(Address.from(address).toNaddr())} />
      </div>
    </div>
    {#if $expandTags.enabled}
      <pre
        class="overflow-auto rounded bg-neutral-900 p-3 text-xs"
        on:click|stopPropagation
        transition:slide|local>{JSON.stringify(event.tags, null, 2)}</pre>
    {/if}
  </div>
</Card>
