<script lang="ts">
  import {assocPath} from "ramda"
  import {quantify, switcherFn, updatePath} from "hurdak"
  import {inc} from "@welshman/lib"
  import {FeedType, hasSubFeeds, getSubFeeds} from "@welshman/feeds"
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
  import DVMField from "src/app/shared/DVMField.svelte"
  import {searchRelayUrls, searchListAddrs, displayListByAddress, displayRelayUrl} from "src/engine"

  export let feed
  export let onChange
  export let onCancel

  const pushCursor = i => {
    cursor = [...cursor, i]
  }

  const popCursor = i => {
    cursor = cursor.slice(0, -1)
  }

  const setAtCursor = (v, p = []) => {
    feed = assocPath(cursor.concat(p), v, feed)
  }

  const updateAtCursor = (f, p = []) => {
    feed = updatePath(cursor.concat(p), f, feed)
  }

  const addFeed = feedType => setAtCursor([...current, [feedType]])

  const removeFeed = i => setAtCursor(current.toSpliced(i, 1))

  const onTypeChange = type => {
    if (hasSubFeeds([type])) {
      if (hasSubFeeds(current)) {
        setAtCursor([type, ...current.slice(1)])
      } else {
        setAtCursor([type, current])
      }
    } else if (type === FeedType.Filter) {
      setAtCursor([type, {}])
    } else if (type === FeedType.DVM) {
      setAtCursor([type, {kind: 5300, tags: [], relays: []}])
    } else {
      setAtCursor([type])
    }
  }

  const displayFeed = ([type, ...feed]) =>
    switcherFn(type, {
      [FeedType.Filter]: () => quantify(feed.length, "filter"),
      [FeedType.List]: () => quantify(feed.length, "list"),
      [FeedType.DVM]: () => quantify(feed.length, "DVM"),
      [FeedType.Relay]: () =>
        quantify(feed.slice(1).length, "feed") + " on " + quantify(feed[0].length, "relays"),
      [FeedType.Union]: () => "union of " + quantify(feed.length, "feed"),
      [FeedType.Intersection]: () => "union of " + quantify(feed.length, "feed"),
      [FeedType.Difference]: () => "union of " + quantify(feed.length, "feed"),
      [FeedType.SymmetricDifference]: () => "union of " + quantify(feed.length, "feed"),
    })

  let cursor = []

  $: console.log(JSON.stringify(feed, null, 2))
  $: current = cursor.reduce((f, i) => f[i], feed)
  $: subFeeds = getSubFeeds(current)
  $: feedType = current[0]
</script>

<FlexColumn class="pb-32">
  <Field label="Feed Type">
    <Select value={feedType} onChange={onTypeChange}>
      <option value={FeedType.Filter}>Using filters</option>
      <option value={FeedType.List}>From lists</option>
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
  </Field>
  {#if feedType === FeedType.Relay}
    <Field label="Relay Selections">
      <SearchSelect
        multiple
        value={feed[1] || []}
        search={$searchRelayUrls}
        onChange={urls => setAtCursor(urls, [1])}>
        <span slot="item" let:item>{displayRelayUrl(item)}</span>
      </SearchSelect>
      <p slot="info">Select which relays you'd like to limit loading feeds from.</p>
    </Field>
  {:else if feedType === FeedType.Filter}
    {#each current.slice(1) as filter, filterIdx ([current.length, filterIdx].join(":"))}
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
  {:else if feedType === FeedType.List}
    <Field label="List Selections">
      <SearchSelect
        multiple
        value={current.slice(1)}
        search={$searchListAddrs}
        onChange={addrs => setAtCursor([FeedType.List, ...addrs])}>
        <span slot="item" let:item>{displayListByAddress(item)}</span>
      </SearchSelect>
      <p slot="info">Select which lists you'd like to view.</p>
    </Field>
  {:else if feedType === FeedType.DVM}
    {#each current.slice(1) as item, itemIdx ([current.length, itemIdx].join(":"))}
      {@const feedIdx = inc(itemIdx)}
      <Card>
        <DVMField
          dvmItem={item}
          onChange={item => setAtCursor(item, [feedIdx])}
          onRemove={() => updateAtCursor(feed => feed.toSpliced(feedIdx, 1))} />
      </Card>
      {#if feedIdx < current.length - 1}
        <p class="staatliches text-center">— OR —</p>
      {/if}
    {/each}
    <div class="flex">
      <Anchor button on:click={() => setAtCursor([...current, {kind: 5300, tags: [], relays: []}])}>
        <i class="fa fa-plus" /> Add DVM
      </Anchor>
    </div>
  {/if}
  {#each subFeeds as subFeed, i (displayFeed(subFeed) + i)}
    <Card class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <Anchor on:click={() => removeFeed(feed.indexOf(subFeed))}>
          <i class="fa fa-trash fa-sm" />
        </Anchor>
        <span class="text-lg">{displayFeed(subFeed)}</span>
      </div>
      <Anchor class="flex items-center gap-2" on:click={() => pushCursor(feed.indexOf(subFeed))}>
        <i class="fa fa-edit" /> Edit
      </Anchor>
    </Card>
    {#if i < subFeeds.length - 1}
      <p class="staatliches text-center">
        {#if feedType === FeedType.Union}
          — OR —
        {:else if feedType === FeedType.Intersection}
          — AND —
        {:else if feedType === FeedType.Difference}
          — WITHOUT —
        {:else if feedType === FeedType.SymmetricDifference}
          — XOR —
        {/if}
      </p>
    {/if}
  {/each}
  {#if hasSubFeeds(current)}
    <div class="inline-block">
      <Popover theme="transparent" opts={{hideOnClick: true}} class="inline-block">
        <div slot="trigger">
          <Anchor button><i class="fa fa-plus" /> Add Feed</Anchor>
        </div>
        <div slot="tooltip">
          <Menu>
            <MenuItem on:click={() => addFeed(FeedType.Filter)}>Standard Feed</MenuItem>
            <MenuItem on:click={() => addFeed(FeedType.List)}>List Feed</MenuItem>
            <MenuItem on:click={() => addFeed(FeedType.DVM)}>DVM Feed</MenuItem>
          </Menu>
        </div>
      </Popover>
    </div>
  {/if}
  <div class="flex items-center justify-end gap-3">
    {#if current === feed}
      <Anchor button on:click={onCancel}>Cancel</Anchor>
      <Anchor button accent on:click={() => onChange(feed)}>Save</Anchor>
    {:else}
      <Anchor button on:click={popCursor}>Done</Anchor>
    {/if}
  </div>
</FlexColumn>
