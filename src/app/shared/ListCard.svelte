<script lang="ts">
  import {quantify} from 'hurdak'
  import {first} from '@welshman/lib'
  import {Tags} from '@welshman/util'
  import {defaultTagFeedMappings} from '@welshman/feeds'
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Card from "src/partials/Card.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import CopyValueSimple from "src/partials/CopyValueSimple.svelte"
  import {readList, displayList, mapListToFeed} from "src/domain"
  import {repository} from "src/engine"
  import {globalFeed} from "src/app/state"
  import {router} from "src/app/util"

  export let address

  const tagTypes = defaultTagFeedMappings.map(first) as string[]
  const event = repository.getEvent(address)
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
        <i class="fa fa-rss" />
        <Anchor on:click={loadFeed} class={list.title ? "" : "text-neutral-400"}>
          {displayList(list)}
        </Anchor>
      </span>
      <slot name="controls" />
    </div>
    {#if list.description}
      <p>{list.description}</p>
    {/if}
    <div class="flex items-center justify-between">
      {quantify(tags.filterByKey(tagTypes).count(), 'item')}
      <CopyValueSimple value={address} class="text-neutral-400" />
    </div>
  </FlexColumn>
</Card>
