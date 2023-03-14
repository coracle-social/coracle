<script>
  import {fuzzy} from "src/util/misc"
  import {personKinds} from "src/util/nostr"
  import Input from "src/partials/Input.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import PersonInfo from "src/views/person/PersonInfo.svelte"
  import {getUserReadRelays} from "src/agent/relays"
  import {watch} from "src/agent/table"
  import network from "src/agent/network"
  import user from "src/agent/user"

  export let hideFollowing = false

  let q
  let results = []

  const {petnamePubkeys} = user
  const search = watch("people", t =>
    fuzzy(t.all({"kind0.name:!nil": null}), {
      keys: ["kind0.name", "kind0.about", "pubkey"],
    })
  )

  $: results = $search(q).slice(0, 50)

  // Prime our database, in case we don't have any people stored yet
  network.load({
    relays: getUserReadRelays(),
    filter: {kinds: personKinds, limit: 10},
  })

  document.title = "Search"
</script>

<Input bind:value={q} placeholder="Search for people">
  <i slot="before" class="fa-solid fa-search" />
</Input>
{#each results as person (person.pubkey)}
  {#if person.pubkey !== user.getPubkey() && !(hideFollowing && $petnamePubkeys.includes(person.pubkey))}
    <PersonInfo {person} />
  {/if}
{:else}
  <Spinner />
{/each}
