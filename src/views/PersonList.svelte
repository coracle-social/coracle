<script type="ts">
  import Content from 'src/partials/Content.svelte'
  import PersonInfo from 'src/partials/PersonInfo.svelte'
  import database from 'src/agent/database'
  import network from 'src/agent/network'

  export let pubkeys

  const people = database.watch('people', t => pubkeys.map(database.getPersonWithFallback))

  network.loadPeople(pubkeys)
</script>

<Content gap={2}>
  {#each ($people || []) as person}
  <PersonInfo {person} />
  {/each}
</Content>
