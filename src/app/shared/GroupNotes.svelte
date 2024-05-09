<script lang="ts">
  import {without} from "ramda"
  import {decodeAddress, isGroupAddress} from "@welshman/util"
  import {feedFromFilter} from "@welshman/feeds"
  import {noteKinds} from "src/util/nostr"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Menu from "src/partials/Menu.svelte"
  import MenuItem from "src/partials/MenuItem.svelte"
  import Chip from "src/partials/Chip.svelte"
  import Popover from "src/partials/Popover.svelte"
  import Feed from "src/app/shared/Feed.svelte"
  import NoteCreateInline from "src/app/shared/NoteCreateInline.svelte"
  import {makeFeed} from "src/domain"
  import {canSign, deriveGroup} from "src/engine"

  export let address

  const group = deriveGroup(address)

  const feed = makeFeed({
    definition: feedFromFilter({
      kinds: without([30402], noteKinds),
      "#a": [address],
    }),
  })
</script>

<FlexColumn large>
  {#if $group.feeds?.length > 0}
    <Popover
      class="inline-block"
      placement="bottom-end"
      theme="transparent"
      opts={{hideOnClick: true}}>
      <div slot="trigger" class="flex cursor-pointer justify-end">
        <Chip class="mb-2 mr-2 inline-block">
          Viewing: {feed ? feed[1] : "Notes"}
          <i class="fa fa-caret-down p-1" />
        </Chip>
      </div>
      <div slot="tooltip">
        <Menu>
          <MenuItem>Notes</MenuItem>
          {#each $group.feeds as feed (feed.join(":"))}
            <MenuItem>{feed[1]}</MenuItem>
          {/each}
        </Menu>
      </div>
    </Popover>
  {/if}
  {#if $canSign}
    <NoteCreateInline group={address} />
  {/if}
  <Feed eager {feed} shouldListen skipNetwork={isGroupAddress(decodeAddress(address))} />
</FlexColumn>
