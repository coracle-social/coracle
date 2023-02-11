<script>
  import {fuzzy} from "src/util/misc"
  import Input from "src/partials/Input.svelte"
  import PersonInfo from 'src/partials/PersonInfo.svelte'
  import {user} from 'src/agent/helpers'
  import database from 'src/agent/database'

  let q
  let search

  database.people.iter({'name:!nil': null}).then(people => {
    search = fuzzy(people, {keys: ["name", "about", "pubkey"]})
  })
</script>

<Input bind:value={q} placeholder="Search for people">
  <i slot="before" class="fa-solid fa-search" />
</Input>

{#each (search ? search(q) : []).slice(0, 30) as person (person.pubkey)}
  {#if person.pubkey !== $user.pubkey}
  <PersonInfo {person} />
  {/if}
{/each}
