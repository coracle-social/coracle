<script lang="ts">
  import {FeedType} from "@welshman/feeds"
  import Anchor from "src/partials/Anchor.svelte"
  import SearchSelect from "src/partials/SearchSelect.svelte"
  import PersonBadge from "src/app/shared/PersonBadge.svelte"
  import {profileSearch} from "src/engine"
  import {router} from "src/app/util/router"

  export let feed
  export let onChange
</script>

<span class="staatliches text-lg">Which mentions would you like to see?</span>
<SearchSelect
  multiple
  value={feed.slice(2)}
  search={$profileSearch.searchValues}
  onChange={pubkeys => onChange([FeedType.Tag, "#p", ...pubkeys])}>
  <span slot="item" let:item let:context>
    {#if context === "value"}
      <Anchor modal href={router.at("people").of(item).toString()}>
        {$profileSearch.displayValue(item)}
      </Anchor>
    {:else}
      <PersonBadge inert pubkey={item} />
    {/if}
  </span>
</SearchSelect>
