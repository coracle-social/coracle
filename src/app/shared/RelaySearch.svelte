<script lang="ts">
  import {onDestroy} from "svelte"
  import {groupBy, filter} from "ramda"
  import {mapVals} from "hurdak"
  import {isShareableRelay, Tags} from "paravel"
  import {createScroller} from "src/util/misc"
  import {getAvgRating} from "src/util/nostr"
  import {getModal} from "src/partials/state"
  import Input from "src/partials/Input.svelte"
  import RelayCard from "src/app/shared/RelayCard.svelte"
  import type {Relay} from "src/engine"
  import {
    load,
    session,
    relays,
    getPubkeyHints,
    getRelaySearch,
    relayPolicyUrls,
    normalizeRelayUrl,
    urlToRelay,
  } from "src/engine"

  export let q = ""
  export let limit = 50
  export let placeholder = "Search relays or add a custom url"
  export let hideIfEmpty = false

  let reviews = []

  const searchRelays = relays
    .derived(filter((r: Relay) => !$relayPolicyUrls.includes(r.url) && isShareableRelay(r.url)))
    .derived(getRelaySearch)

  const loadMore = async () => {
    limit += 50
  }

  const scroller = createScroller(loadMore, {element: getModal()})

  $: ratings = mapVals(
    getAvgRating,
    groupBy(e => normalizeRelayUrl(Tags.from(e).getValue("r")), reviews)
  )

  load({
    relays: getPubkeyHints($session?.pubkey, "read"),
    filters: [{limit: 1000, kinds: [1986], "#l": ["review/relay"]}],
    onEvent: event => {
      reviews = reviews.concat(event)
    },
  })

  onDestroy(() => {
    scroller.stop()
  })
</script>

<div class="flex flex-col gap-4">
  <Input bind:value={q} type="text" wrapperClass="flex-grow" {placeholder}>
    <i slot="before" class="fa-solid fa-search" />
  </Input>
  <div class="flex flex-col gap-2">
    {#if q.match("^.+\\..+$")}
      {@const relay = urlToRelay(q)}
      <slot name="item" {relay}>
        <RelayCard rating={ratings[relay.url]} {relay} />
      </slot>
    {/if}
    {#each !q && hideIfEmpty ? [] : $searchRelays(q).slice(0, limit) as relay (relay.url)}
      <slot name="item" {relay}>
        <RelayCard rating={ratings[relay.url]} {relay} />
      </slot>
    {/each}
    {#if q || !hideIfEmpty}
      <slot name="footer">
        <small class="text-center">
          Showing {Math.min(($relays || []).length - $relayPolicyUrls.length, limit)}
          of {($relays || []).length - $relayPolicyUrls.length} known relays
        </small>
      </slot>
    {/if}
  </div>
</div>
