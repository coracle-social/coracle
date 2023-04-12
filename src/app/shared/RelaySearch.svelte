<script>
  import {pluck} from "ramda"
  import {fuzzy} from "src/util/misc"
  import Input from "src/partials/Input.svelte"
  import RelayCard from "src/app/shared/RelayCard.svelte"
  import {watch} from "src/agent/db"
  import user from "src/agent/user"

  export let q = ""
  export let limit = 50
  export let relays = user.relays
  export let placeholder = "Search known relays"
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
