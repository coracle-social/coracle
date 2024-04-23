<script lang="ts">
  import {omit} from "ramda"
  import {quantify, pluralize, displayList} from "hurdak"
  import type {DynamicFilter, Feed} from "@welshman/feeds"
  import {FeedType, Scope, getSubFeeds} from "@welshman/feeds"
  import {formatTimestampAsDate} from "src/util/misc"
  import Popover from "src/partials/Popover.svelte"
  import Subheading from "src/partials/Subheading.svelte"
  import Menu from "src/partials/Menu.svelte"
  import MenuItem from "src/partials/MenuItem.svelte"
  import Chip from "src/partials/Chip.svelte"
  import Toggle from "src/partials/Toggle.svelte"
  import Modal from "src/partials/Modal.svelte"
  import FeedForm from "src/app/shared/FeedForm.svelte"
  import {feedLoader, displayPubkey} from "src/engine"

  export let value

  const openModal = () => {
    isOpen = true
  }

  const closeModal = () => {
    isOpen = false
  }

  const toggleReplies = () => {
    value = {...value, shouldHideReplies: !value.shouldHideReplies}
  }

  const setPart = (filter: DynamicFilter) => {
    saveFeed([feed[0], {...feed[1], ...filter}] as Feed)
  }

  const removeParts = (keys: string[]) => {
    saveFeed([feed[0], omit(keys, feed[1])] as Feed)
  }

  const saveFeed = f => {
    feed = f
    value = {...value, feed}
    closeModal()
  }

  const displayPeople = pubkeys =>
    pubkeys.length === 1 ? displayPubkey(pubkeys[0]) : `${pubkeys.length} people`

  const displayTopics = topics => (topics.length === 1 ? topics[0] : `${topics.length} topics`)

  let isOpen = false

  $: feed = value.feed
  $: feedType = feed[0]
  $: subFeeds = getSubFeeds(feed)
</script>

<div class="-mb-2">
  <div class="float-right flex justify-end">
    <div class="flex items-center gap-1 px-2">
      <Toggle scale={0.6} value={!value.shouldHideReplies} on:change={toggleReplies} />
      <small class="text-neutral-200">Show replies</small>
    </div>
    <i class="fa fa-search cursor-pointer p-2" on:click={openModal} />
    <slot name="controls" />
  </div>
  <div class="mb-2 mr-2 inline-block py-1">Showing notes:</div>
  {#if subFeeds.length > 0}
    <Chip class="mb-2 mr-2 inline-block">
      Custom feed ({quantify(subFeeds.length, "selection")})
    </Chip>
  {/if}
  {#if feedType === FeedType.Relay}
    <Chip class="mb-2 mr-2 inline-block">
      On {quantify(feed[1], "relay")}
    </Chip>
  {:else if feedType === FeedType.List}
    <Chip class="mb-2 mr-2 inline-block">
      From {quantify(feed.slice(1), "list")}
    </Chip>
  {:else if feedType === FeedType.LOL}
    <Chip class="mb-2 mr-2 inline-block">
      From {quantify(feed.slice(1), "list")} of lists
    </Chip>
  {:else if feedType === FeedType.DVM}
    <Chip class="mb-2 mr-2 inline-block">
      From {quantify(feed.slice(1), "DVM")}
    </Chip>
  {:else if feedType === FeedType.Filter}
    {#if feed.length > 2}
      <Chip class="mb-2 mr-2 inline-block">
        From {quantify(feed.slice(1).length, "filter")}
      </Chip>
    {:else}
      {#await feedLoader.compiler.compile(feed)}
        <!-- pass -->
      {:then { filters: [filter] }}
        <Popover
          class="inline-block"
          placement="bottom-end"
          theme="transparent"
          opts={{hideOnClick: true}}>
          <div slot="trigger" class="cursor-pointer">
            <Chip class="mb-2 mr-2 inline-block">
              {#if feed[1].scopes}
                From {displayList(feed[1].scopes)}
              {:else if filter.authors}
                From {quantify(filter.authors.length, "author")}
              {:else}
                From global
              {/if}
              <i class="fa fa-caret-down p-1" />
            </Chip>
          </div>
          <div slot="tooltip">
            <Menu>
              <MenuItem on:click={() => setPart({scopes: [Scope.Follows]})}>
                <i class="fa fa-user-plus mr-2" /> Follows
              </MenuItem>
              <MenuItem on:click={() => setPart({scopes: [Scope.Network]})}>
                <i class="fa fa-share-nodes mr-2" /> Network
              </MenuItem>
              <MenuItem on:click={() => removeParts(["scopes"])}>
                <i class="fa fa-earth-americas mr-2" /> Global
              </MenuItem>
              <MenuItem on:click={openModal}>
                <i class="fa fa-cog mr-2" /> Custom
              </MenuItem>
            </Menu>
          </div>
        </Popover>
        {#if filter.kinds?.length > 0}
          <Chip class="mb-2 mr-2 inline-block" onRemove={() => removeParts(["kinds"])}>
            {pluralize(filter.kinds.length, "Kind")}
            {displayList(filter.kinds)}
          </Chip>
        {/if}
        {#if filter["#p"]?.length > 0}
          <Chip class="mb-2 mr-2 inline-block" onRemove={() => removeParts(["#p"])}>
            Mentioning {displayPeople(filter["#p"])}
          </Chip>
        {/if}
        {#if filter["#t"]?.length > 0}
          <Chip class="mb-2 mr-2 inline-block" onRemove={() => removeParts(["#t"])}>
            Related to {displayTopics(filter["#t"])}
          </Chip>
        {/if}
        {#if filter.search}
          <Chip class="mb-2 mr-2 inline-block" onRemove={() => removeParts(["search"])}>
            Matching {filter.search}
          </Chip>
        {/if}
        {#if filter.since && filter.until}
          {@const since = formatTimestampAsDate(filter.since)}
          {@const until = formatTimestampAsDate(filter.until)}
          <Chip class="mb-2 mr-2 inline-block" onRemove={() => removeParts(["since", "until"])}>
            Between {since} and {until}
          </Chip>
        {:else if filter.since}
          <Chip class="mb-2 mr-2 inline-block" onRemove={() => removeParts(["since"])}>
            From {formatTimestampAsDate(filter.since)}
          </Chip>
        {:else if filter.until}
          <Chip class="mb-2 mr-2 inline-block" onRemove={() => removeParts(["until"])}>
            Through {formatTimestampAsDate(filter.until)}
          </Chip>
        {/if}
      {/await}
    {/if}
  {/if}
  <div class="inline-block rounded-full border border-neutral-100" on:click={openModal}>
    <div class="flex h-7 w-7 items-center justify-center">
      <i class="fa fa-plus cursor-pointer" />
    </div>
  </div>
</div>

{#if isOpen}
  <Modal onEscape={closeModal}>
    <Subheading>Customize Feed</Subheading>
    <FeedForm {feed} onCancel={closeModal} onChange={saveFeed} />
  </Modal>
{/if}
