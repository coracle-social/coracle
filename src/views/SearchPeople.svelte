<script>
  import {fuzzy} from "src/util/misc"
  import PersonInfo from 'src/partials/PersonInfo.svelte'
  import {user, database} from 'src/agent'

  export let q

  let search

  database.people.all({'name:!nil': null}).then(people => {
    search = fuzzy(people, {keys: ["name", "about", "pubkey"]})
  })
</script>

{#each (search ? search(q) : []).slice(0, 30) as person (person.pubkey)}
  {#if person.pubkey !== $user.pubkey}
  <PersonInfo {person} />
  {/if}
{/each}
