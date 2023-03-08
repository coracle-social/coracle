<script>
  import {pluck} from "ramda"
  import {fuzzy} from "src/util/misc"
  import Input from "src/partials/Input.svelte"
  import RelayCard from "src/views/relays/RelayCard.svelte"
  import database from "src/agent/database"
  import user from "src/agent/user"

  let q = ""
  let search
  let knownRelays = database.watch("relays", t => t.all())

  const {relays} = user

  $: {
    const joined = new Set(pluck("url", $relays))

    search = fuzzy(
      $knownRelays.filter(r => !joined.has(r.url)),
      {keys: ["name", "description", "url"]}
    )
  }
</script>

<Input bind:value={q} type="text" wrapperClass="flex-grow" placeholder="Type to search">
  <i slot="before" class="fa-solid fa-search" />
</Input>
{#each (search(q) || []).slice(0, 50) as relay (relay.url)}
  <RelayCard {relay} />
{/each}
<small class="text-center">
  Showing {Math.min(($knownRelays || []).length - $relays.length, 50)}
  of {($knownRelays || []).length - $relays.length} known relays
</small>
