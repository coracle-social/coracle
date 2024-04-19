<script lang="ts">
  import {assocPath} from "ramda"
  import {quantify, switcherFn, updatePath} from "hurdak"
  import {inc} from "@coracle.social/lib"
  import {getFilterId} from "@coracle.social/util"
  import {FeedType, hasSubFeeds, getSubFeeds} from "@coracle.social/feeds"
  import Card from "src/partials/Card.svelte"
  import Popover from "src/partials/Popover.svelte"
  import Menu from "src/partials/Menu.svelte"
  import MenuItem from "src/partials/MenuItem.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Field from "src/partials/Field.svelte"
  import Select from "src/partials/Select.svelte"
  import SearchSelect from "src/partials/SearchSelect.svelte"
  import FilterField from "src/app/shared/FilterField.svelte"
  import {searchRelayUrls, displayRelayUrl} from "src/engine"

  export let feed
  export let onChange
  export let onCancel

  const pushCursor = i => {
    cursor = [...cursor, i]
  }

  const popCursor = i => {
    cursor = cursor.slice(-1)
  }

  const setAtCursor = (v, p = []) => {
    feed = assocPath(cursor.concat(p), v, feed)
  }

  const updateAtCursor = (f, p = []) => {
    feed = updatePath(cursor.concat(p), f, feed)
  }

  const addFeed = feedType => setAtCursor([...current, [feedType]])

  const onTypeChange = type => setAtCursor([type])

  const onRelayChange = urls => setAtCursor(urls, [1])

  const displayFeed = ([type, ...feed]) =>
    switcherFn(type, {
      [FeedType.Filter]: () => quantify(feed.length, "filter"),
      [FeedType.List]: () => quantify(feed.length, "list"),
      [FeedType.LOL]: () => quantify(feed.length, "list") + " of lists",
      [FeedType.DVM]: () => quantify(feed.length, "DVM"),
      [FeedType.Relay]: () =>
        quantify(feed.slice(1).length, "feed") + " on " + quantify(feed[0].length, "relays"),
      [FeedType.Union]: () => "union of " + quantify(feed.length, "feed"),
      [FeedType.Intersection]: () => "union of " + quantify(feed.length, "feed"),
      [FeedType.Difference]: () => "union of " + quantify(feed.length, "feed"),
      [FeedType.SymmetricDifference]: () => "union of " + quantify(feed.length, "feed"),
    })

  let cursor = []

  $: console.log(feed)
  $: current = cursor.reduce((f, i) => f[i], feed)
  $: subFeeds = getSubFeeds(current)
  $: feedType = current[0]
</script>

<FlexColumn class="pb-32">
  <Field label="Feed Type">
    <Select value={feedType} onChange={onTypeChange}>
      <option value={FeedType.Filter}>Standard</option>
      <option value={FeedType.List}>List</option>
      <option value={FeedType.LOL}>List of lists</option>
      <option value={FeedType.DVM}>Data vending machine</option>
      <option value={FeedType.Relay}>Relays</option>
      <option value={FeedType.Union}>Union</option>
      <option value={FeedType.Intersection}>Intersection</option>
      <option value={FeedType.Difference}>Difference</option>
      <option value={FeedType.SymmetricDifference}>Symmetric Difference</option>
    </Select>
    <p slot="info">
      Select which feed type you'd like to use. In addition to some basic feed types, nostr also
      supports combinations of sub-feeds using set operators for advanced use cases.
    </p>
    <p></p></Field>
  {#if feedType === FeedType.Relay}
    <Field label="Relay Selections">
      <SearchSelect
        multiple
        value={feed[1] || []}
        search={$searchRelayUrls}
        onChange={onRelayChange}>
        <span slot="item" let:item>{displayRelayUrl(item)}</span>
      </SearchSelect>
      <p slot="info">Select which relays you'd like to limit loading feeds from.</p>
      <p></p></Field>
  {:else if feedType === FeedType.Filter}
    {#each current.slice(1) as filter, filterIdx (getFilterId(filter) + filterIdx)}
      {@const feedIdx = inc(filterIdx)}
      <Card>
        <FilterField
          {filter}
          onChange={filter => setAtCursor(filter, [feedIdx])}
          onRemove={() => updateAtCursor(feed => feed.toSpliced(feedIdx, 1))} />
      </Card>
      {#if feedIdx < current.length - 1}
        <p class="staatliches text-center">— OR —</p>
      {/if}
    {/each}
    <div class="flex">
      <Anchor button on:click={() => setAtCursor([...current, {}])}>
        <i class="fa fa-plus" /> Add filter
      </Anchor>
    </div>
  {:else if feedType === FeedType.List}{:else if feedType === FeedType.LOL}{:else if feedType === FeedType.DVM}{/if}
  {#each subFeeds as subFeed, i (displayFeed(subFeed) + i)}
    <Card class="flex items-center justify-between">
      <span class="text-lg">{displayFeed(subFeed)}</span>
      <Anchor class="flex items-center gap-2" on:click={() => pushCursor(feed.indexOf(subFeed))}>
        <i class="fa fa-edit" /> Edit
      </Anchor>
    </Card>
    {#if i < subFeeds.length - 1}
      <p class="staatliches text-center">— OR —</p>
    {/if}
  {/each}
  <div class="flex items-center justify-end gap-3">
    {#if hasSubFeeds(feed)}
      <Popover theme="transparent" opts={{hideOnClick: true}}>
        <span slot="trigger" class="cursor-pointer">
          <i class="fa fa-plus" /> Add feed
        </span>
        <div slot="tooltip">
          <Menu>
            <MenuItem on:click={() => addFeed(FeedType.Filter)}>Standard Feed</MenuItem>
            <MenuItem on:click={() => addFeed(FeedType.List)}>List Feed</MenuItem>
            <MenuItem on:click={() => addFeed(FeedType.LOL)}>Lists of Lists</MenuItem>
            <MenuItem on:click={() => addFeed(FeedType.DVM)}>DVM Feed</MenuItem>
          </Menu>
        </div>
      </Popover>
    {/if}
    <Anchor button on:click={() => onCancel()}>Cancel</Anchor>
    <Anchor button accent on:click={() => onChange(feed)}>Save</Anchor>
  </div>
</FlexColumn>
