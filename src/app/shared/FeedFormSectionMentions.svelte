<script lang="ts">
  import {FeedType} from "@welshman/feeds"
  import Field from "src/partials/Field.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import SearchSelect from "src/partials/SearchSelect.svelte"
  import PersonBadge from "src/app/shared/PersonBadge.svelte"
  import {searchPubkeys, displayPubkey} from "src/engine"
  import {router} from "src/app/util/router"

  export let feed
  export let onChange
</script>

<Field label="Which mentions would you like to see?">
  <SearchSelect
    multiple
    value={feed.slice(2)}
    search={$searchPubkeys}
    onChange={pubkeys => onChange([FeedType.Tag, "#p", ...pubkeys])}>
    <span slot="item" let:item let:context>
      {#if context === "value"}
        <Anchor modal href={router.at("people").of(item).toString()}>
          {displayPubkey(item)}
        </Anchor>
      {:else}
        <PersonBadge inert pubkey={item} />
      {/if}
    </span>
  </SearchSelect>
</Field>
