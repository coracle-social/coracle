<script lang="ts">
  import {FeedType} from "@welshman/feeds"
  import Anchor from "src/partials/Anchor.svelte"
  import SearchSelect from "src/partials/SearchSelect.svelte"
  import GroupName from "src/app/shared/GroupName.svelte"
  import {groupMetaSearch} from "src/engine"
  import {router} from "src/app/util/router"

  export let feed
  export let onChange
</script>

<span class="staatliches text-lg">Which groups would you like to see?</span>
<SearchSelect
  multiple
  value={feed.slice(2)}
  search={$groupMetaSearch.searchValues}
  onChange={addresses => onChange([FeedType.Tag, "#a", ...addresses])}>
  <span slot="item" let:item let:context>
    {#if context === "value"}
      <Anchor modal href={router.at("groups").of(item).toString()}>
        {$groupMetaSearch.displayValue(item)}
      </Anchor>
    {:else}
      <GroupName address={item} />
    {/if}
  </span>
</SearchSelect>
