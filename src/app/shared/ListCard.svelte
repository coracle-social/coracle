<script lang="ts">
  import {quantify} from 'hurdak'
  import {first} from '@welshman/lib'
  import {Tags} from '@welshman/util'
  import {defaultTagFeedMappings} from '@welshman/feeds'
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

  const tagTypes = defaultTagFeedMappings.map(first) as string[]
  const event = repository.getEvent(address)
  const deleted = repository.isDeleted(event)
  const tags = Tags.fromEvent(event)
  const list = readList(event)

  const loadFeed = () => {
    globalFeed.set(mapListToFeed(list))
    router.at("notes").push()
  }
</script>

<Card>
  <FlexColumn>
    <div class="flex items-center justify-between">
      <span class="staatliches flex items-center gap-3 text-xl">
        <i class="fa fa-list" />
        <span
          class:text-neutral-400={!list.title}
          class:line-through={deleted}>
          <Anchor on:click={loadFeed}>
            {displayList(list)}
          </Anchor>
        </span>
        {#if deleted}
          <Chip danger small>Deleted</Chip>
        {/if}
      </span>
      <slot name="controls" />
    </div>
    {#if list.description}
      <p>{list.description}</p>
    {/if}
    <div class="flex items-center justify-between">
      {quantify(tags.filterByKey(tagTypes).count(), 'item')}
      <CopyValueSimple label="List address" value={address} class="text-neutral-400" />
    </div>
  </FlexColumn>
</Card>
