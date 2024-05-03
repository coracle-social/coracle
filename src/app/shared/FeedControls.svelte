<script lang="ts">
  import {quantify, pluralize, displayList} from "hurdak"
  import {isNil, clamp} from "@welshman/lib"
  import {Tags} from "@welshman/util"
  import {
    FeedType,
    isScopeFeed,
    isSearchFeed,
    isAuthorFeed,
    isCreatedAtFeed,
    makeSearchFeed,
    makeScopeFeed,
    makeIntersectionFeed,
    Scope,
    hasSubFeeds,
    getFeedArgs,
    feedsFromTags,
  } from "@welshman/feeds"
  import {slide} from "src/util/transition"
  import {formatTimestampAsDate, getStringWidth} from "src/util/misc"
  import Modal from "src/partials/Modal.svelte"
  import Field from "src/partials/Field.svelte"
  import Input from "src/partials/Input.svelte"
  import Popover from "src/partials/Popover.svelte"
  import Popover2 from "src/partials/Popover2.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Menu from "src/partials/Menu.svelte"
  import MenuItem from "src/partials/MenuItem.svelte"
  import Chip from "src/partials/Chip.svelte"
  import Toggle from "src/partials/Toggle.svelte"
  import FeedField from "src/app/shared/FeedField.svelte"
  import {router} from "src/app/util"
  import {hints, createAndPublish, displayRelayUrl, displayPubkey, displayList as displayList2, userLists} from "src/engine"

  export let value

  const openListMenu = () => {
    listMenuIsOpen = true
  }

  const closeListMenu = () => {
    listMenuIsOpen = false
  }

  const openForm = () => {
    formIsOpen = true
  }

  const closeForm = () => {
    formIsOpen = false
  }

  const openName = () => {
    nameIsOpen = true
  }

  const closeName = () => {
    nameIsOpen = false
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

  const getSearch = feed => getFeedArgs(feed)?.find(isSearchFeed)?.[1] as string | null

  const onDraftFeedChange = feed => {
    draftFeed = feed
  }

  const setFeed = feed => {
    draftFeed = feed
    value = {...value, feed}
    search = getSearch(feed)
    closeListMenu()
    closeForm()
  }

  const setSubFeed = subFeed => {
    const idx = feed.findIndex(f => f[0] === subFeed[0])

    setFeed(idx >= 0 ? feed.toSpliced(idx, 1, subFeed) : [...feed, subFeed])
  }

  const removeSubFeed = subFeed => {
    setFeed(feed.filter(f => f !== subFeed))
  }

  const saveFeed = async (feed) => {
    const pub = await createAndPublish({
      kind: FEED,
      content: JSON.stringify(feed),
      tags: [["d", randomId()], ["name", name]],
      relays: hints.WriteRelays().getUrls(),
    })

    address = getAddress(pub.event)
    setFeed(feed)
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

    if (text) {
      setSubFeed(makeSearchFeed(text))
    } else {
      removeSubFeed(subFeeds.find(isSearchFeed))
    }
  }

  const loadList = list => setFeed(makeIntersectionFeed(...feedsFromTags(Tags.fromEvent(list))))

  const displayPeople = pubkeys =>
    pubkeys.length === 1 ? displayPubkey(pubkeys[0]) : `${pubkeys.length} people`

  const displayTopics = topics => (topics.length === 1 ? topics[0] : `${topics.length} topics`)

  const normalize = feed => hasSubFeeds(feed) ? feed : [FeedType.Intersection, feed]

  let address = null
  let formIsOpen = false
  let nameIsOpen = false
  let listMenuIsOpen = false
  let searchFocused = false
  let name = ""
  let search = getSearch(value.feed)
  let draftFeed = normalize(value.feed)

  $: feed = normalize(value.feed)
  $: subFeeds = getFeedArgs(feed)
  $: currentScopeFeed = subFeeds.find(f => isScopeFeed(f) || isAuthorFeed(f))
</script>

<div class="-mb-2">
  <div class="float-right flex justify-end items-center h-8">
    <div class="flex items-center gap-1 px-2">
      <Toggle scale={0.6} value={!value.shouldHideReplies} on:change={toggleReplies} />
      <small class="text-neutral-200">Show replies</small>
    </div>
    <div class="relative lg:hidden">
      <div class="w-6 text-center cursor-pointer bg-neutral-700 text-neutral-50 rounded transition-colors hover:bg-neutral-600" on:click={openListMenu}>
        <i class="fa fa-sm fa-ellipsis-v" />
      </div>
      {#if listMenuIsOpen}
        <Popover2 absolute hideOnClick onClose={closeListMenu} class="right-0 top-8 w-60">
          <Menu>
            <MenuItem inert class="flex items-center justify-between bg-neutral-800 shadow">
              <span class="staatliches text-lg">Your Feeds</span>
              <Anchor href={router.at("feeds").toString()}>
                <i class="fa fa-cog" />
              </Anchor>
            </MenuItem>
            <div class="max-h-96 overflow-auto">
              {#each $userLists as list}
                <MenuItem on:click={() => loadList(list)}>{displayList2(list)}</MenuItem>
              {/each}
            </div>
          </Menu>
        </Popover2>
      {/if}
    </div>
  </div>
  <div class="mb-2 mr-2 inline-block py-1">Showing notes:</div>
  {#if feed[0] !== FeedType.Intersection}
    <Chip class="mb-2 mr-2 inline-block">
      Custom feed ({quantify(subFeeds.length, "selection")})
    </Chip>
    <Chip class="cursor-pointer" on:click={openForm}>
      <div class="flex h-6 items-center justify-center">
        <i class="fa fa-cog" />
      </div>
    </Chip>
  {:else}
    <Popover
      class="inline-block"
      placement="bottom-end"
      theme="transparent"
      opts={{hideOnClick: true}}>
      <div slot="trigger" class="cursor-pointer">
        <Chip class="mb-2 mr-2 inline-block">
          {#if currentScopeFeed && isScopeFeed(currentScopeFeed)}
            From {displayList(getFeedArgs(currentScopeFeed))}
          {:else if currentScopeFeed && isAuthorFeed(currentScopeFeed)}
            From {quantify(getFeedArgs(currentScopeFeed).length, "author")}
          {:else}
            From global
          {/if}
          <i class="fa fa-caret-down p-1" />
        </Chip>
      </div>
      <div slot="tooltip">
        <Menu>
          <MenuItem on:click={() => setSubFeed(makeScopeFeed(Scope.Follows))}>
            <i class="fa fa-user-plus mr-2" /> Follows
          </MenuItem>
          <MenuItem on:click={() => setSubFeed(makeScopeFeed(Scope.Network))}>
            <i class="fa fa-share-nodes mr-2" /> Network
          </MenuItem>
          <MenuItem on:click={() => removeSubFeed(currentScopeFeed)}>
            <i class="fa fa-earth-americas mr-2" /> Global
          </MenuItem>
        </Menu>
      </div>
    </Popover>
    {#each subFeeds as subFeed}
      {@const feedType = subFeed[0]}
      {#if ![FeedType.Search, FeedType.Scope, FeedType.Author].includes(feedType)}
        <Chip class="mb-2 mr-2 inline-block" onRemove={() => removeSubFeed(subFeed)}>
          {#if feedType === FeedType.Relay}
            On {subFeed.length === 2 ? displayRelayUrl(subFeed[1]) : `${subFeed.length - 1} relays`}
          {:else if feedType === FeedType.List}
            From {quantify(getFeedArgs(subFeed).length, "list")}
          {:else if feedType === FeedType.Address || feedType === FeedType.ID}
            {quantify(getFeedArgs(subFeed).length, "event")}
          {:else if feedType === FeedType.DVM}
            From {quantify(getFeedArgs(subFeed).length, "DVM")}
          {:else if feedType === FeedType.Kind}
            {@const kinds = getFeedArgs(subFeed)}
            {pluralize(kinds.length, "Kind")}
            {displayList(kinds)}
          {:else if feedType === FeedType.Tag}
            {@const [key, ...values] = getFeedArgs(subFeed)}
            {#if key === "#p"}
              Mentioning {displayPeople(values)}
            {:else if key === "#t"}
              Related to {displayTopics(values)}
            {:else if key === "#e" || key === "#a"}
              Tagging {pluralize(values.length, "event")}
            {:else}
              {pluralize(values.length, "other tag")}
            {/if}
          {:else if isCreatedAtFeed(subFeed)}
            {#each getFeedArgs(subFeed) as { since, until, relative }}
              {#if since && until}
                Between {formatTimestampAsDate(since)} and {formatTimestampAsDate(until)}
              {:else if since}
                From {formatTimestampAsDate(since)}
              {:else if until}
                Through {formatTimestampAsDate(until)}
              {/if}
            {/each}
          {/if}
        </Chip>
      {/if}
    {/each}
    <Chip class="cursor-pointer">
      <div class="flex items-center">
        <div class="flex w-6 h-6 items-center justify-center" on:click={openForm}>
          <i class="fa fa-plus" />
        </div>
        <div class="flex w-6 h-6 items-center justify-center" on:click={showSearch}>
          <i class="fa fa-search" />
        </div>
        {#if !isNil(search)}
          {@const min = searchFocused ? 60 : 0}
          {@const width = getStringWidth(search)}
          <input
            autofocus
            class="bg-transparent outline-none pl-1"
            class:transition-all={width < min || !searchFocused}
            style={`width: ${clamp([min, 150], width) + 10}px`}
            transition:slide|local={{axis: "x", duration: 200}}
            bind:value={search}
            on:focus={onSearchFocus}
            on:blur={onSearchBlur} />
        {/if}
      </div>
    </Chip>
  {/if}
</div>

{#if formIsOpen}
  <Modal onEscape={closeForm}>
    <FeedField feed={draftFeed} onChange={onDraftFeedChange} />
    <div class="flex justify-between gap-2">
      <Anchor button on:click={closeForm}>Discard</Anchor>
      <div class="flex gap-2">
        <Anchor button on:click={openName}>Save Feed</Anchor>
        <Anchor button accent on:click={() => setFeed(draftFeed)}>Done</Anchor>
      </div>
    </div>
  </Modal>
{/if}

{#if nameIsOpen}
  <Modal onEscape={closeName}>
    <Field label="What would you like to name this feed?">
      <Input bind:value={name} />
    </Field>
    <div class="flex justify-between gap-2">
      <Anchor button on:click={closeName}>Cancel</Anchor>
      <Anchor button accent on:click={() => saveFeed(draftFeed)}>Save</Anchor>
    </div>
  </Modal>
{/if}
