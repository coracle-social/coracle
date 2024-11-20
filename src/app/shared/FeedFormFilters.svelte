<script lang="ts">
  import {toTitle} from "hurdak"
  import {
    getFeedArgs,
    isGlobalFeed,
    isCreatedAtFeed,
    isAuthorFeed,
    isKindFeed,
    isDVMFeed,
    isRelayFeed,
    isSearchFeed,
    isListFeed,
    makeTagFeed,
    makeAuthorFeed,
    makeRelayFeed,
    makeSearchFeed,
    makeKindFeed,
    makeCreatedAtFeed,
    makeListFeed,
    makeDVMFeed,
  } from "@welshman/feeds"
  import {toSpliced} from "src/util/misc"
  import Card from "src/partials/Card.svelte"
  import Menu from "src/partials/Menu.svelte"
  import MenuItem from "src/partials/MenuItem.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Popover2 from "src/partials/Popover2.svelte"
  import FeedFormSectionPeople from "src/app/shared/FeedFormSectionPeople.svelte"
  import FeedFormSectionRelays from "src/app/shared/FeedFormSectionRelays.svelte"
  import FeedFormSectionSearch from "src/app/shared/FeedFormSectionSearch.svelte"
  import FeedFormSectionTopics from "src/app/shared/FeedFormSectionTopics.svelte"
  import FeedFormSectionMentions from "src/app/shared/FeedFormSectionMentions.svelte"
  import FeedFormSectionKinds from "src/app/shared/FeedFormSectionKinds.svelte"
  import FeedFormSectionCreatedAt from "src/app/shared/FeedFormSectionCreatedAt.svelte"
  import FeedFormSectionList from "src/app/shared/FeedFormSectionList.svelte"
  import FeedFormSectionDVM from "src/app/shared/FeedFormSectionDVM.svelte"
  import FeedFormSaveAsList from "src/app/shared/FeedFormSaveAsList.svelte"
  import {isTopicFeed, isPeopleFeed, isMentionFeed} from "src/domain"

  export let feed
  export let onChange

  const addFeed = newFeed => onChange([...feed, newFeed])

  const onSubFeedChange = (i, newFeed) => onChange(toSpliced(feed, i, 1, newFeed))

  const onSubFeedRemove = i => onChange(toSpliced(feed, i, 1))

  const openMenu = () => {
    menuIsOpen = true
  }

  const closeMenu = () => {
    menuIsOpen = false
  }

  let menuIsOpen = false

  $: subFeeds = getFeedArgs(feed)
  $: hasTopics = subFeeds.some(isTopicFeed)
  $: hasMentions = subFeeds.some(isMentionFeed)
  $: hasPeople = subFeeds.some(isPeopleFeed)
  $: hasRelays = subFeeds.some(isRelayFeed)
  $: hasSearch = subFeeds.some(isSearchFeed)
  $: hasKinds = subFeeds.some(isKindFeed)
  $: hasCreatedAt = subFeeds.some(isCreatedAtFeed)
  $: hasList = subFeeds.some(isListFeed)
  $: hasDVM = subFeeds.some(isDVMFeed)
</script>

{#key feed.length}
  {#each subFeeds as subFeed, i}
    {@const idx = i + 1}
    {@const change = f => onSubFeedChange(idx, f)}
    {@const canSave =
      isAuthorFeed(subFeed) ||
      isRelayFeed(subFeed) ||
      isTopicFeed(subFeed) ||
      isMentionFeed(subFeed)}
    {#if canSave || !isGlobalFeed(subFeed)}
      <Card class="relative">
        <FlexColumn>
          <FlexColumn small>
            {#if isPeopleFeed(subFeed)}
              <FeedFormSectionPeople feed={subFeed} onChange={change} />
            {:else if isRelayFeed(subFeed)}
              <FeedFormSectionRelays feed={subFeed} onChange={change} />
            {:else if isSearchFeed(subFeed)}
              <FeedFormSectionSearch feed={subFeed} onChange={change} />
            {:else if isTopicFeed(subFeed)}
              <FeedFormSectionTopics feed={subFeed} onChange={change} />
            {:else if isMentionFeed(subFeed)}
              <FeedFormSectionMentions feed={subFeed} onChange={change} />
            {:else if isKindFeed(subFeed)}
              <FeedFormSectionKinds feed={subFeed} onChange={change} />
            {:else if isCreatedAtFeed(subFeed)}
              <FeedFormSectionCreatedAt feed={subFeed} onChange={change} />
            {:else if isListFeed(subFeed)}
              <FeedFormSectionList feed={subFeed} onChange={change} />
            {:else if isDVMFeed(subFeed)}
              <FeedFormSectionDVM feed={subFeed} onChange={change} />
            {:else}
              No support for editing {toTitle(subFeed[0])} filters. Click "Advanced" to edit manually.
            {/if}
          </FlexColumn>
          {#if canSave}
            <FeedFormSaveAsList feed={subFeed} onChange={change} />
          {/if}
        </FlexColumn>
        {#if i > 0}
          <button
            type="button"
            class="absolute right-2 top-2 h-4 w-4 cursor-pointer"
            on:click={() => onSubFeedRemove(idx)}>
            <i class="fa fa-times" />
          </button>
        {/if}
      </Card>
    {/if}
  {/each}
{/key}

{#if !hasTopics || !hasMentions || !hasPeople || !hasRelays || !hasSearch || !hasKinds || !hasCreatedAt || !hasDVM || !hasList}
  <div class="relative">
    {#if menuIsOpen}
      <Popover2 hideOnClick onClose={closeMenu} position="top">
        <Menu class="relative -top-12 m-auto w-48">
          {#if !hasTopics}
            <MenuItem on:click={() => addFeed(makeTagFeed("#t"))}>Topics</MenuItem>
          {/if}
          {#if !hasMentions}
            <MenuItem on:click={() => addFeed(makeTagFeed("#p"))}>Mentions</MenuItem>
          {/if}
          {#if !hasPeople}
            <MenuItem on:click={() => addFeed(makeAuthorFeed())}>Authors</MenuItem>
          {/if}
          {#if !hasRelays}
            <MenuItem on:click={() => addFeed(makeRelayFeed())}>Relays</MenuItem>
          {/if}
          {#if !hasSearch}
            <MenuItem on:click={() => addFeed(makeSearchFeed(""))}>Search</MenuItem>
          {/if}
          {#if !hasKinds}
            <MenuItem on:click={() => addFeed(makeKindFeed())}>Kinds</MenuItem>
          {/if}
          {#if !hasCreatedAt}
            <MenuItem on:click={() => addFeed(makeCreatedAtFeed())}>Date range</MenuItem>
          {/if}
          {#if !hasList}
            <MenuItem on:click={() => addFeed(makeListFeed())}>From a list</MenuItem>
          {/if}
          {#if !hasDVM}
            <MenuItem on:click={() => addFeed(makeDVMFeed({kind: 5300}))}
              >Data vending machine</MenuItem>
          {/if}
        </Menu>
      </Popover2>
    {/if}
    <Anchor
      class="flex items-center justify-center rounded-lg border border-dashed border-neutral-500 p-4 text-neutral-300"
      on:click={openMenu}>
      <span class="staatliches underline">Add a filter</span>
    </Anchor>
  </div>
{/if}
