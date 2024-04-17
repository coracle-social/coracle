<script lang="ts">
  import {quantify, switcherFn} from 'hurdak'
  import {inc} from "@coracle.social/lib"
  import {FeedType, hasSubFeeds, getSubFeeds} from "@coracle.social/feeds"
  import Card from "src/partials/Card.svelte"
  import Popover from "src/partials/Popover.svelte"
  import Menu from "src/partials/Menu.svelte"
  import MenuItem from "src/partials/MenuItem.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Field from "src/partials/Field.svelte"
  import FieldInline from "src/partials/FieldInline.svelte"
  import Select from "src/partials/Select.svelte"
  import SearchSelect from "src/partials/SearchSelect.svelte"
  import FilterField from "src/app/shared/FilterField.svelte"
  import {searchRelayUrls, displayRelayUrl} from "src/engine"

  export let feed
  export let onChange
  export let onCancel

  const addFeed = feedType => {
    feed = [...feed, [feedType]]
  }

  const onTypeChange = type => {
    feed = [type]
  }

  const onRelayChange = urls => {
    feed[1] = urls
  }

  const onFilterChange = (filter, i) => {
    feed[i] = filter
  }

  const displayFeed = ([type, ...feed]) =>
    switcherFn(type, {
      [FeedType.Filter]: () => quantify(feed.length, 'filter'),
      [FeedType.List]: () => quantify(feed.length, 'list'),
      [FeedType.LOL]: () => quantify(feed.length, 'list') + ' of lists',
      [FeedType.DVM]: () => quantify(feed.length, 'DVM'),
      [FeedType.Relay]: () => quantify(feed.slice(1).length, 'feed') + ' on ' + quantify(feed[0].length, 'relays'),
      [FeedType.Union]: () => 'union of ' + quantify(feed.length, 'feed'),
      [FeedType.Intersection]: () => 'union of ' + quantify(feed.length, 'feed'),
      [FeedType.Difference]: () => 'union of ' + quantify(feed.length, 'feed'),
      [FeedType.SymmetricDifference]: () => 'union of ' + quantify(feed.length, 'feed'),
    })

  $: feedType = feed[0]
  $: subFeeds = getSubFeeds(feed)

  $: console.log(feedType, feed)
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
    {#each feed.slice(1) as filter, i}
      <Card>
        <FilterField {filter} onChange={filter => onFilterChange(filter, inc(i))} />
      </Card>
    {/each}
  {:else if feedType === FeedType.List}
  {:else if feedType === FeedType.LOL}
  {:else if feedType === FeedType.DVM}
  {/if}
  {#each subFeeds as subFeed, i}
    <Card class="flex justify-between items-center">
      <span class="text-lg">{displayFeed(subFeed)}</span>
      <Anchor class="flex gap-2 items-center" on:click={() => setCursor(subFeed)}>
        <i class="fa fa-edit" /> Edit
      </Anchor>
    </Card>
    {#if i < subFeeds.length - 1}
      <p class="staatliches text-center">— OR —</p>
    {/if}
  {/each}
  <div class="flex justify-end items-center gap-3">
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
