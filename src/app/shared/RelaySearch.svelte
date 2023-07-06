<script>
  import {onMount} from "svelte"
  import {pluck, groupBy} from "ramda"
  import {mapValues} from "hurdak/lib/hurdak"
  import {fuzzy} from "src/util/misc"
  import {normalizeRelayUrl, Tags, getAvgQuality} from "src/util/nostr"
  import Input from "src/partials/Input.svelte"
  import RelayCard from "src/app/shared/RelayCard.svelte"
  import {routing} from "src/system"
  import network from "src/agent/network"
  import {watch} from "src/agent/db"

  export let q = ""
  export let limit = 50
  export let placeholder = "Search relays or add a custom url"
  export let hideIfEmpty = false

  let search
  let reviews = []

  const userRelays = watch(routing.policies, () => routing.getUserRelays())
  const knownRelays = watch(routing.relays, () => routing.relays.all())

  $: ratings = mapValues(
    events => getAvgQuality("review/relay", events),
    groupBy(e => Tags.from(e).getMeta("r"), reviews)
  )

  $: {
    const joined = new Set(pluck("url", $userRelays))

    search = fuzzy(
      $knownRelays.filter(r => !joined.has(r.url)),
      {keys: ["name", "description", "url"]}
    )
  }

  onMount(async () => {
    reviews = await network.load({
      relays: routing.getUserRelays("read"),
      filter: {
        limit: 1000,
        kinds: [1985],
        "#l": ["review/relay"],
        "#L": ["social.coracle.ontology"],
      },
    })
  })
</script>

<div class="flex flex-col gap-4">
  <Input bind:value={q} type="text" wrapperClass="flex-grow" {placeholder}>
    <i slot="before" class="fa-solid fa-search" />
  </Input>
  <div class="flex flex-col gap-2">
    {#if q.match("^.+\\..+$")}
      <RelayCard relay={{url: normalizeRelayUrl(q)}} />
    {/if}
    {#each !q && hideIfEmpty ? [] : search(q).slice(0, limit) as relay (relay.url)}
      <slot name="item" {relay}>
        <RelayCard rating={ratings[relay.url]} {relay} />
      </slot>
    {/each}
    <slot name="footer">
      <small class="text-center">
        Showing {Math.min(($knownRelays || []).length - $userRelays.length, 50)}
        of {($knownRelays || []).length - $userRelays.length} known relays
      </small>
    </slot>
  </div>
</div>
