<script lang="ts">
  import {FeedType} from "@welshman/feeds"
  import SearchSelect from "src/partials/SearchSelect.svelte"
  import {relaySearch} from "src/engine"

  export let feed
  export let onChange
</script>

<span class="staatliches text-lg">Which relays would you like to use?</span>
<SearchSelect
  multiple
  value={feed.slice(1)}
  search={$relaySearch.searchValues}
  onChange={urls => onChange([FeedType.Relay, ...urls])}>
  <span slot="item" let:item>{$relaySearch.displayValue(item)}</span>
</SearchSelect>
