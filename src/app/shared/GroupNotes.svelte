<script lang="ts">
  import {without, last} from "ramda"
  import {Tag, Tags, decodeAddress, isGroupAddress, getIdFilters} from "@welshman/util"
  import {feedFromFilter} from "@welshman/feeds"
  import {noteKinds, generatePrivateKey} from "src/util/nostr"
  import {fly} from "src/util/transition"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Menu from "src/partials/Menu.svelte"
  import MenuItem from "src/partials/MenuItem.svelte"
  import Chip from "src/partials/Chip.svelte"
  import Popover from "src/partials/Popover.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import Note from "src/app/shared/Note.svelte"
  import Feed from "src/app/shared/Feed.svelte"
  import NoteCreateInline from "src/app/shared/NoteCreateInline.svelte"
  import {load, hints, canSign, deriveGroup, dvmRequest} from "src/engine"

  export let address

  const group = deriveGroup(address)

  const loadFeed = async f => {
    const pubkey = last(f)

    let pub

    const result = await dvmRequest({
      kind: 5300,
      sk: generatePrivateKey(),
      relays: hints.ForPubkeys([pubkey]).getUrls(),
      tags: [Tag.fromPubkey(pubkey).valueOf()],
      onPublish: p => {
        pub = p
      },
    })

    const scenario = hints.scenario(
      Tags.fromEvent(result)
        .filterByKey(["e", "a"])
        .rejectByValue([pub.request.event.id])
        .mapTo(t => hints.selection(t.value(), [t.mark()]))
        .valueOf(),
    )

    for (const {relay, values} of scenario.getSelections()) {
      load({
        relays: [relay],
        filters: getIdFilters(values),
        onEvent: e => {
          feedEvents = feedEvents.concat(e)
        },
      })
    }
  }

  const setFeed = f => {
    feed = f
    feedEvents = []
  }

  let feed = null
  let feedEvents = []

  $: {
    if (feed) {
      loadFeed(feed)
    }
  }
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
          <MenuItem on:click={() => setFeed(null)}>Notes</MenuItem>
          {#each $group.feeds as feed (feed.join(":"))}
            <MenuItem on:click={() => setFeed(feed)}>{feed[1]}</MenuItem>
          {/each}
        </Menu>
      </div>
    </Popover>
  {/if}
  {#if !feed}
    {#if $canSign}
      <NoteCreateInline group={address} />
    {/if}
    <Feed
      eager
      shouldListen
      skipNetwork={isGroupAddress(decodeAddress(address))}
      feed={feedFromFilter({kinds: without([30402], noteKinds), "#a": [address]})} />
  {:else}
    {#each feedEvents as event}
      <div in:fly={{y: 20}}>
        <Note note={event} />
      </div>
    {:else}
      <Spinner />
    {/each}
  {/if}
</FlexColumn>
