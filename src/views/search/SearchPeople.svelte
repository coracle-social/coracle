<script>
  import {fuzzy} from "src/util/misc"
  import {personKinds} from "src/util/nostr"
  import Input from "src/partials/Input.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import PersonInfo from 'src/views/person/PersonInfo.svelte'
  import {getUserReadRelays} from 'src/agent/relays'
  import database from 'src/agent/database'
  import network from 'src/agent/network'
  import user from 'src/agent/user'

  export let hideFollowing = false

  let q
  let search

  const {petnamePubkeys} = user

  database.watch('people', table => {
    search = fuzzy(
      table.all({'kind0.name:!nil': null}),
      {keys: ["kind0.name", "kind0.about", "pubkey"]}
    )
  })

  // Prime our database, in case we don't have any people stored yet
  network.load({
    relays: getUserReadRelays(),
    filter: {kinds: personKinds, limit: 10},
  })
</script>

<Input bind:value={q} placeholder="Search for people">
  <i slot="before" class="fa-solid fa-search" />
</Input>

{#each (search ? search(q) : []).slice(0, 50) as person (person.pubkey)}
  {#if person.pubkey !== user.getPubkey() && !(hideFollowing && $petnamePubkeys.includes(person.pubkey))}
  <PersonInfo {person} />
  {/if}
{:else}
<Spinner />
{/each}
