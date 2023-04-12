<script>
  import Input from "src/partials/Input.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import PersonInfo from "src/app/shared/PersonInfo.svelte"
  import {getUserReadRelays} from "src/agent/relays"
  import {searchPeople} from "src/agent/db"
  import network from "src/agent/network"
  import user from "src/agent/user"

  let q

  $: results = $searchPeople(q).slice(0, 50)

  // Prime our database, in case we don't have any people stored yet
  network.load({
    relays: getUserReadRelays(),
    filter: {kinds: [0], limit: 10},
  })
</script>

<Input bind:value={q} placeholder="Search for people">
  <i slot="before" class="fa-solid fa-search" />
</Input>
{#each results as person (person.pubkey)}
  {#if person.pubkey !== user.getPubkey()}
    <PersonInfo {person} />
  {/if}
{:else}
  <Spinner />
{/each}
