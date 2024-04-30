<script lang="ts">
  import {FeedType} from "@welshman/feeds"
  import Field from "src/partials/Field.svelte"
  import SearchSelect from "src/partials/SearchSelect.svelte"
  import {searchRelayUrls, displayRelayUrl} from "src/engine"

  export let feed
  export let controller
</script>

<Field label="Which relays would you like to use?">
  <SearchSelect
    multiple
    value={feed.slice(1)}
    search={$searchRelayUrls}
    onChange={urls => controller.setAtCursor([FeedType.Relay, ...urls])}>
    <span slot="item" let:item>{displayRelayUrl(item)}</span>
  </SearchSelect>
  <p slot="info">Select which relays you'd like to limit loading feeds from.</p>
</Field>
