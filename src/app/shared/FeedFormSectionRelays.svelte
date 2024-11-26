<script lang="ts">
  import {identity} from "@welshman/lib"
  import {FeedType} from "@welshman/feeds"
  import {relaySearch} from "@welshman/app"
  import {displayRelayUrl} from "@welshman/util"
  import SearchSelect from "src/partials/SearchSelect.svelte"

  export let feed
  export let onChange
</script>

<span class="staatliches text-lg">Which relays would you like to use?</span>
<SearchSelect
  multiple
  value={feed.slice(1)}
  search={$relaySearch.searchValues}
  termToItem={identity}
  onChange={urls => onChange([FeedType.Relay, ...urls])}>
  <span slot="item" let:item>{displayRelayUrl(item)}</span>
</SearchSelect>
