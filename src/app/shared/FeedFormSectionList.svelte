<script lang="ts">
  import {makeListFeed} from "@welshman/feeds"
  import Anchor from "src/partials/Anchor.svelte"
  import SearchSelect from "src/partials/SearchSelect.svelte"
  import {listSearch, displayPubkey, repository} from "src/engine"
  import {router} from 'src/app/util'

  export let feed
  export let onChange

  const onAddressesChange = addresses => onChange(makeListFeed({addresses}))

  $: addresses = feed.slice(1).flatMap(it => it.addresses)
</script>

<span>Which lists would you like to use?</span>
<SearchSelect multiple value={addresses} search={$listSearch.search} onChange={onAddressesChange}>
  <span slot="item" let:item let:context>
    {#if context === "option"}
      {$listSearch.display(item)} by {displayPubkey(repository.getEvent(item).pubkey)}
    {:else}
      <Anchor modal href={router.at("lists").of(item).toString()}>
        {$listSearch.display(item)} by {displayPubkey(repository.getEvent(item).pubkey)}
      </Anchor>
    {/if}
  </span>
</SearchSelect>
