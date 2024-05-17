<script lang="ts">
  import {fromPairs, identity} from "@welshman/lib"
  import {
    getAddress,
    DVM_REQUEST_DISCOVER_CONTENT,
    DVM_REQUEST_DISCOVER_PEOPLE,
    DVM_REQUEST_SEARCH_CONTENT,
    DVM_REQUEST_SEARCH_PEOPLE,
  } from "@welshman/util"
  import type {DVMFeed} from "@welshman/feeds"
  import {getFeedArgs, makeDVMFeed} from "@welshman/feeds"
  import SearchSelect from "src/partials/SearchSelect.svelte"
  import Field from "src/partials/Field.svelte"
  import Input from "src/partials/Input.svelte"
  import HandlerSummary from "src/app/shared/HandlerSummary.svelte"
  import {HandlerSearch} from "src/domain"
  import {handlersByKind} from "src/engine"

  export let feed: DVMFeed
  export let onChange

  const onAddressesChange = addresses => {
    onChange(
      makeDVMFeed(
        ...addresses.map(address => {
          const handler = handlerSearch.getOption(address)
          const dvmItem = {
            kind: handler.kind,
            tags: [["p", handler.event.pubkey]],
          }

          if (searchTerm) {
            dvmItem.tags.push(["i", searchTerm])
          }

          return dvmItem
        }),
      ),
    )
  }

  const discoverKinds = [DVM_REQUEST_DISCOVER_CONTENT, DVM_REQUEST_DISCOVER_PEOPLE]

  const searchKinds = [DVM_REQUEST_SEARCH_CONTENT, DVM_REQUEST_SEARCH_PEOPLE]

  const allKinds = [...discoverKinds, ...searchKinds]

  const handlerSearch = new HandlerSearch(allKinds.flatMap(k => $handlersByKind.get(k) || []))

  const addresses = getFeedArgs(feed).flatMap(item => {
    const handlers = $handlersByKind.get(item.kind) || []
    const pubkey = fromPairs(item.tags || []).p

    return handlers
      .filter(handler => handler.event.pubkey === pubkey)
      .map(handler => getAddress(handler.event))
  })

  let searchTerm =
    getFeedArgs(feed)
      .map(item => fromPairs(item.tags || []).i)
      .find(identity) || ""
</script>

<span class="staatliches text-lg">Which DVMs would you like to request notes from?</span>
<SearchSelect multiple value={addresses} search={handlerSearch.search} onChange={onAddressesChange}>
  <span slot="item" let:item let:context>
    {#if context === "value"}
      {handlerSearch.display(item)}
    {:else}
      <HandlerSummary handler={handlerSearch.getOption(item)} />
    {/if}
  </span>
</SearchSelect>
<Field label="Search term (optional)">
  <Input bind:value={searchTerm}>
    <i slot="before" class="fa fa-search" />
  </Input>
</Field>
