<script lang="ts">
  import {makeListFeed} from "@welshman/feeds"
  import SearchSelect from "src/partials/SearchSelect.svelte"
  import {listSearch} from "src/engine"

  export let feed
  export let onChange

  const onAddressesChange = addresses => onChange(makeListFeed({addresses}))

  $: addresses = feed.slice(1).flatMap(it => it.addresses)
</script>

<span>Which lists would you like to use?</span>
<SearchSelect multiple value={addresses} search={$listSearch.search} onChange={onAddressesChange}>
  <span slot="item" let:item>
    {$listSearch.display(item)}
  </span>
</SearchSelect>
