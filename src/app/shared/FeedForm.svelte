<script lang="ts">
  import {assocPath} from "ramda"
  import {quantify, switcherFn, updatePath} from "hurdak"
  import {inc} from "@welshman/lib"
  import {FeedType, hasSubFeeds, getSubFeeds} from "@welshman/feeds"
  import Icon from "src/partials/Icon.svelte"
  import SelectTiles from "src/partials/SelectTiles.svelte"
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
  import FeedFormRelay from "src/app/shared/FeedFormRelay.svelte"
  import {searchRelayUrls, searchListAddrs, displayListByAddress, displayRelayUrl} from "src/engine"

  export let feed
  export let onChange
  export let onCancel

  const controller = {
    pushCursor: i => {
      cursor = [...cursor, i]
    },
    popCursor: i => {
      cursor = cursor.slice(0, -1)
    },
    setAtCursor: (v, p = []) => {
      feed = assocPath(cursor.concat(p), v, feed)
    },
    updateAtCursor: (f, p = []) => {
      feed = updatePath(cursor.concat(p), f, feed)
    },
    addFeed: feedType => controller.setAtCursor([...current, [feedType]]),
    removeFeed: i => controller.setAtCursor(current.toSpliced(i, 1)),
  }

  const onTypeChange = type => {
    if (hasSubFeeds([type])) {
      if (hasSubFeeds(current)) {
        controller.setAtCursor([type, ...current.slice(1)])
      } else {
        controller.setAtCursor([type, current])
      }
    } else if (type === FeedType.Filter) {
      controller.setAtCursor([type, {}])
    } else if (type === FeedType.DVM) {
      controller.setAtCursor([type, {kind: 5300, tags: [], relays: []}])
    } else {
      controller.setAtCursor([type])
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
  <Card>
    <Field label="Choose a feed type">
      <SelectTiles
        options={[FeedType.Filter, FeedType.Relay, FeedType.DVM, "advanced"]}
        onChange={onTypeChange}
        value={feedType}>
        <div slot="item" class="flex flex-col items-center" let:option let:active>
          {#if option === FeedType.Filter}
            <Icon icon="people-nearby" class="h-12 w-12" color={active ? "accent" : "tinted-800"} />
            <span class="staatliches text-2xl">Standard</span>
          {:else if option === FeedType.Relay}
            <Icon icon="server" class="h-12 w-12" color={active ? "accent" : "tinted-800"} />
            <span class="staatliches text-2xl">Relays</span>
          {:else if option === FeedType.DVM}
            <Icon icon="network" class="h-12 w-12" color={active ? "accent" : "tinted-800"} />
            <span class="staatliches text-2xl">DVMs</span>
          {:else}
            <span class="flex h-12 w-12 items-center justify-center">
              <i class="fa fa-2xl fa-gears" />
            </span>
            <span class="staatliches text-2xl">Advanced</span>
          {/if}
        </div>
      </SelectTiles>
    </Field>
  </Card>
  {#if feedType === FeedType.Relay}
    <FeedFormRelay feed={current} {controller} />
    <Field label="Which relays would you like to use?">
      <SearchSelect
        multiple
        value={current[1] || []}
        search={$searchRelayUrls}
        onChange={urls => controller.setAtCursor(urls, [1])}>
        <span slot="item" let:item>{displayRelayUrl(item)}</span>
      </SearchSelect>
      <p slot="info">Select which relays you'd like to limit loading feeds from.</p>
    </Field>
  {:else if feedType === FeedType.Filter}
    <FeedFormForRelayFeed feed={current} {controller} />
    {#each current.slice(1) as filter, filterIdx ([current.length, filterIdx].join(":"))}
      {@const feedIdx = inc(filterIdx)}
      <Card>
        <FilterField
          {filter}
          onChange={filter => controller.setAtCursor(filter, [feedIdx])}
          onRemove={() => controller.updateAtCursor(feed => feed.toSpliced(feedIdx, 1))} />
      </Card>
      {#if feedIdx < current.length - 1}
        <p class="staatliches text-center">— OR —</p>
      {/if}
    {/each}
    <div class="flex">
      <Anchor button on:click={() => controller.setAtCursor([...current, {}])}>
        <i class="fa fa-plus" /> Add filter
      </Anchor>
    </div>
  {:else if feedType === FeedType.List}
    <Field label="List Selections">
      <SearchSelect
        multiple
        value={current.slice(1)}
        search={$searchListAddrs}
        onChange={addrs => controller.setAtCursor([FeedType.List, ...addrs])}>
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
          onChange={item => controller.setAtCursor(item, [feedIdx])}
          onRemove={() => controller.updateAtCursor(feed => feed.toSpliced(feedIdx, 1))} />
      </Card>
      {#if feedIdx < current.length - 1}
        <p class="staatliches text-center">— OR —</p>
      {/if}
    {/each}
    <div class="flex">
      <Anchor
        button
        on:click={() => controller.setAtCursor([...current, {kind: 5300, tags: [], relays: []}])}>
        <i class="fa fa-plus" /> Add DVM
      </Anchor>
    </div>
  {/if}
  {#each subFeeds as subFeed, i (displayFeed(subFeed) + i)}
    <Card class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <Anchor on:click={() => controller.removeFeed(current.indexOf(subFeed))}>
          <i class="fa fa-trash fa-sm" />
        </Anchor>
        <span class="text-lg">{displayFeed(subFeed)}</span>
      </div>
      <Anchor
        class="flex items-center gap-2"
        on:click={() => controller.pushCursor(current.indexOf(subFeed))}>
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
            <MenuItem on:click={() => controller.addFeed(FeedType.Filter)}>Standard Feed</MenuItem>
            <MenuItem on:click={() => controller.addFeed(FeedType.List)}>List Feed</MenuItem>
            <MenuItem on:click={() => controller.addFeed(FeedType.DVM)}>DVM Feed</MenuItem>
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
      <Anchor button on:click={controller.popCursor}>Done</Anchor>
    {/if}
  </div>
</FlexColumn>
