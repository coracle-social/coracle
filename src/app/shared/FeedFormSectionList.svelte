<script lang="ts">
  import {makeListFeed} from "@welshman/feeds"
  import SearchSelect from "src/partials/SearchSelect.svelte"
  import {displayListByAddress, searchListAddrs} from "src/engine"

  export let feed
  export let onChange

  const onAddressesChange = addresses => onChange(makeListFeed(({addresses})))

  $: addresses = feed.slice(1).flatMap(it => it.addresses)
</script>

<span>Which lists would you like to use?</span>
<SearchSelect
  multiple
  value={addresses}
  search={$searchListAddrs}
  onChange={onAddressesChange}>
  <span slot="item" let:item>
    {displayListByAddress(item)}
  </span>
</SearchSelect>
