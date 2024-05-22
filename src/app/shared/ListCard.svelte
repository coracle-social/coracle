<script lang="ts">
  import {quantify} from "hurdak"
  import {first} from "@welshman/lib"
  import {Tags, toNostrURI, Address} from "@welshman/util"
  import {defaultTagFeedMappings} from "@welshman/feeds"
  import {slide} from 'src/util/transition'
  import {boolCtrl} from 'src/partials/utils'
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Card from "src/partials/Card.svelte"
  import Chip from "src/partials/Chip.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import CopyValueSimple from "src/partials/CopyValueSimple.svelte"
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

<Card>
  <FlexColumn>
    <div class="flex items-center justify-between">
      <span class="staatliches flex items-center gap-3 text-xl">
        <i class="fa fa-list" />
        <span class:text-neutral-400={!list.title} class:line-through={deleted}>
          {displayList(list)}
        </span>
        {#if deleted}
          <Chip danger small>Deleted</Chip>
        {/if}
      </span>
      <slot name="controls">
        <Anchor on:click={loadFeed}>Load as feed</Anchor>
      </slot>
    </div>
    {#if list.description}
      <p>{list.description}</p>
    {/if}
    <div class="flex items-center justify-between">
      <div class="flex gap-2">
        {quantify(tags.filterByKey(tagTypes).count(), "item")}
        <Anchor underline on:click={$expandTags.toggle}>
          {#if $expandTags.enabled}
            Hide tags
          {:else}
            Show all
          {/if}
        </Anchor>
      </div>
      <CopyValueSimple
        label="List address"
        value={toNostrURI(Address.from(address).toNaddr())}
        class="text-neutral-400" />
    </div>
    {#if $expandTags.enabled}
      <pre transition:slide|local>{JSON.stringify(event.tags, null, 2)}</pre>
    {/if}
  </FlexColumn>
</Card>
