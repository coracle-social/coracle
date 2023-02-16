<script>
  import {fly} from 'svelte/transition'
  import {fuzzy} from "src/util/misc"
  import {personKinds} from "src/util/nostr"
  import Input from "src/partials/Input.svelte"
  import PersonInfo from 'src/partials/PersonInfo.svelte'
  import {user} from 'src/agent/user'
  import {getUserReadRelays} from 'src/agent/relays'
  import database from 'src/agent/database'
  import network from 'src/agent/network'

  let q
  let search

  database.watch('people', people => {
    search = fuzzy(
      people.all({'name:!nil': null}),
      {keys: ["name", "about", "pubkey"]}
    )
  })

  // Prime our database, in case we don't have any people stored yet
  network.listenUntilEose(getUserReadRelays(), {kinds: personKinds, limit: 300})
</script>

<Input bind:value={q} placeholder="Search for people">
  <i slot="before" class="fa-solid fa-search" />
</Input>

{#each (search ? search(q) : []).slice(0, 30) as person (person.pubkey)}
  {#if person.pubkey !== $user?.pubkey}
  <div in:fly={{y: 20}}>
    <PersonInfo {person} />
  </div>
  {/if}
{/each}
