<script lang="ts">
  import {makeListFeed} from "@welshman/feeds"
  import Anchor from "src/partials/Anchor.svelte"
  import SearchSelect from "src/partials/SearchSelect.svelte"
  import {listSearch, displayPersonByPubkey, repository} from "src/engine"
  import {router} from "src/app/util"

  export let feed
  export let onChange

  const onAddressesChange = addresses => onChange(makeListFeed({addresses}))

  const displayAddress = address => {
    const event = repository.getEvent(address)

    return event
      ? `${$listSearch.display(address)} by ${displayPersonByPubkey(event.pubkey)}`
      : $listSearch.display(address)
  }

  $: addresses = feed.slice(1).flatMap(it => it.addresses)
</script>

<span>Which lists would you like to use?</span>
<SearchSelect multiple value={addresses} search={$listSearch.search} onChange={onAddressesChange}>
  <span slot="item" let:item let:context>
    {#if context === "option"}
      {displayAddress(item)}
    {:else}
      <Anchor modal href={router.at("lists").of(item).toString()}>
        {displayAddress(item)}
      </Anchor>
    {/if}
  </span>
</SearchSelect>
