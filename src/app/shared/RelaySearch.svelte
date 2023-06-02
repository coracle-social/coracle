<script>
  import {pluck} from "ramda"
  import {fuzzy} from "src/util/misc"
  import {normalizeRelayUrl} from "src/util/nostr"
  import Input from "src/partials/Input.svelte"
  import RelayCard from "src/app/shared/RelayCard.svelte"
  import {watch} from "src/agent/db"
  import user from "src/agent/user"

  export let q = ""
  export let limit = 50
  export let relays = user.relays
  export let placeholder = "Search relays or add a custom url"
  export let hideIfEmpty = false

  let search
  let knownRelays = watch("relays", t => t.all())

  $: {
    const joined = new Set(pluck("url", $relays))

    search = fuzzy(
      $knownRelays.filter(r => !joined.has(r.url)),
      {keys: ["name", "description", "url"]}
    )
  }
</script>

<div class="flex flex-col gap-2">
  <Input bind:value={q} type="text" wrapperClass="flex-grow" {placeholder}>
    <i slot="before" class="fa-solid fa-search" />
  </Input>
  {#if q.match("^.+\\..+$")}
    <RelayCard relay={{url: normalizeRelayUrl(q)}} />
  {/if}
  {#each !q && hideIfEmpty ? [] : search(q).slice(0, limit) as relay (relay.url)}
    <slot name="item" {relay}>
      <RelayCard {relay} />
    </slot>
  {/each}
  <slot name="footer">
    <small class="text-center">
      Showing {Math.min(($knownRelays || []).length - $relays.length, 50)}
      of {($knownRelays || []).length - $relays.length} known relays
    </small>
  </slot>
</div>
