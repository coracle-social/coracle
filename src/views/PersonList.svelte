<script type="ts">
  import Content from 'src/partials/Content.svelte'
  import PersonInfo from 'src/partials/PersonInfo.svelte'
  import {database, getRelays} from 'src/agent'
  import loaders from 'src/app/loaders'

  export let pubkeys

  const people = database.watch('people', people => people.all({pubkey: pubkeys}))

  loaders.loadPeople(getRelays(), pubkeys)
</script>

<Content gap={2}>
  {#each ($people || []) as person}
  <PersonInfo {person} />
  {/each}
</Content>
