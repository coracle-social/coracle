<script lang="ts">
  import {groupBy, filter} from "ramda"
  import {mapVals} from "hurdak"
  import {Tags, getAvgQuality} from "src/util/nostr"
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
    urlToRelay,
  } from "src/engine"

  export let q = ""
  export let limit = 50
  export let placeholder = "Search relays or add a custom url"
  export let hideIfEmpty = false

  let reviews = []

  const searchRelays = relays
    .derived(filter((r: Relay) => !$relayPolicyUrls.includes(r.url)))
    .derived(getRelaySearch)

  $: ratings = mapVals(
    events => getAvgQuality("review/relay", events),
    groupBy(e => Tags.from(e).getMeta("r"), reviews)
  )

  load({
    relays: getPubkeyHints($session.pubkey, "read"),
    filters: [
      {
        limit: 1000,
        kinds: [1985],
        "#l": ["review/relay"],
        "#L": ["social.coracle.ontology"],
      },
    ],
    onEvent: event => {
      reviews = reviews.concat(event)
    },
  })
</script>

<div class="flex flex-col gap-4">
  <Input bind:value={q} type="text" wrapperClass="flex-grow" {placeholder}>
    <i slot="before" class="fa-solid fa-search" />
  </Input>
  <div class="flex flex-col gap-2">
    {#if q.match("^.+\\..+$")}
      <slot name="item" relay={urlToRelay(q)}>
        <RelayCard relay={urlToRelay(q)} />
      </slot>
    {/if}
    {#each !q && hideIfEmpty ? [] : $searchRelays(q).slice(0, limit) as relay (relay.url)}
      <slot name="item" {relay}>
        <RelayCard rating={ratings[relay.url]} {relay} />
      </slot>
    {/each}
    <slot name="footer">
      <small class="text-center">
        Showing {Math.min(($relays || []).length - $relayPolicyUrls.length, 50)}
        of {($relays || []).length - $relayPolicyUrls.length} known relays
      </small>
    </slot>
  </div>
</div>
