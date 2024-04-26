<script lang="ts">
  import {omit} from "ramda"
  import {quantify, pluralize, displayList} from "hurdak"
  import {isNil, clamp} from "@welshman/lib"
  import type {DynamicFilter, Feed} from "@welshman/feeds"
  import {FeedType, Scope, getSubFeeds} from "@welshman/feeds"
  import {slide} from 'src/util/transition'
  import {formatTimestampAsDate, getStringWidth} from "src/util/misc"
  import Popover from "src/partials/Popover.svelte"
  import Subheading from "src/partials/Subheading.svelte"
  import Menu from "src/partials/Menu.svelte"
  import MenuItem from "src/partials/MenuItem.svelte"
  import Chip from "src/partials/Chip.svelte"
  import Toggle from "src/partials/Toggle.svelte"
  import Modal from "src/partials/Modal.svelte"
  import FeedForm from "src/app/shared/FeedForm.svelte"
  import {feedLoader, displayRelayUrl, displayPubkey} from "src/engine"

  export let value

  const openModal = () => {
    isOpen = true
  }

  const closeModal = () => {
    isOpen = false
  }

  const showSearch = () => {
    search = search || ""
    searchFocused = true
  }

  const hideSearch = () => {
    search = null
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

  const onSearchFocus = () => {
    searchFocused = true
  }

  const onSearchBlur = () => {
    const text = search.trim()

    searchFocused = false

    if (!text) {
      hideSearch()
    }

    if (text === (feed[1]?.search || "")) {
      return
    }

    if (text) {
      setPart({search: text})
    } else {
      removeParts(['search'])
    }
  }

  const saveFeed = f => {
    feed = f
    value = {...value, feed}
    search = feed[1]?.search
    closeModal()
  }

  const displayPeople = pubkeys =>
    pubkeys.length === 1 ? displayPubkey(pubkeys[0]) : `${pubkeys.length} people`

  const displayTopics = topics => (topics.length === 1 ? topics[0] : `${topics.length} topics`)

  let isOpen = false
  let search = value.feed[1]?.search
  let searchFocused = false

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
    <i class="fa fa-sliders cursor-pointer p-2" on:click={openModal} />
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
      On {feed[1].length === 1 ? displayRelayUrl(feed[1][0]) : `${feed[1].length} relays`}
    </Chip>
  {:else if feedType === FeedType.List}
    <Chip class="mb-2 mr-2 inline-block">
      From {quantify(feed.slice(1).length, "list")}
    </Chip>
  {:else if feedType === FeedType.DVM}
    <Chip class="mb-2 mr-2 inline-block">
      From {quantify(feed.slice(1).length, "DVM")}
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
    <Chip class="cursor-pointer" on:click={showSearch}>
      <div class="flex h-6 items-center justify-center">
        <i class="fa fa-search" />
      </div>
      {#if !isNil(search)}
        {@const min = searchFocused ? 60 : 0}
        {@const width = getStringWidth(search)}
        <input
          autofocus
          class="bg-transparent outline-none"
          class:transition-all={width < min || !searchFocused}
          style={`width: ${clamp([min, 150], width) + 10}px`}
          transition:slide|local={{axis: "x", duration: 200}}
          bind:value={search}
          on:focus={onSearchFocus}
          on:blur={onSearchBlur} />
      {/if}
    </Chip>
  {/if}
</div>

{#if isOpen}
  <Modal onEscape={closeModal}>
    <Subheading>Create a custom Feed</Subheading>
    <FeedForm {feed} onCancel={closeModal} onChange={saveFeed} />
  </Modal>
{/if}
