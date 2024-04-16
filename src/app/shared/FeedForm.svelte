<script lang="ts">
  import {FeedType, getSubFeeds} from '@coracle.social/feeds'
  import Card from "src/partials/Card.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Field from "src/partials/Field.svelte"
  import FieldInline from "src/partials/FieldInline.svelte"
  import Select from "src/partials/Select.svelte"
  import SearchSelect from "src/partials/SearchSelect.svelte"
  import {searchRelayUrls, displayRelayUrl} from 'src/engine'

  export let feed
  export let onChange

  const onTypeChange = e => {
    feed = [e.detail]
  }

  const onRelayChange = e => {
    feed[1] = e.detail
  }

  $: feedType = feed[0]
  $: subFeeds = getSubFeeds(feed)

  $: console.log(feedType, feed)
</script>

<FlexColumn>
  <Field label="Feed Type">
    <Select value={feedType} on:change={onTypeChange}>
      <option value={FeedType.Filter}>Filter</option>
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
      Select which feed type you'd like to use. In addition to some basic feed types,
      nostr also supports combinations of sub-feeds using set operators for advanced
      use cases.
    <p>
  </Field>
  {#if feedType === FeedType.Relay}
    <Field label="Relay Selections">
      <SearchSelect
        multiple
        value={feed[1] || []}
        search={$searchRelayUrls}
        on:change={onRelayChange}>
        <span slot="item" let:item>{displayRelayUrl(item)}</span>
      </SearchSelect>
      <p slot="info">
        Select which relays you'd like to limit loading feeds from.
      <p>
    </Field>
  {:else if feedType === FeedType.Filter}
    {#each feed.slice(1) as filter}
      <FilterForm {feed} />
    {/each}
  {:else if feedType === FeedType.List}
  {:else if feedType === FeedType.LOL}
  {:else if feedType === FeedType.DVM}
  {/if}
  {#each subFeeds as subFeed, i}
    <Card>
    </Card>
    {#if i < subFeeds.length - 1}
      <p class="staatliches">OR</p>
    {/if}
  {/each}
</FlexColumn>
