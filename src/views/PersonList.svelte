<script type="ts">
  import Content from 'src/partials/Content.svelte'
  import PersonInfo from 'src/partials/PersonInfo.svelte'
  import {getUserRelays, getTopRelays} from 'src/agent/helpers'
  import database from 'src/agent/database'
  import network from 'src/agent/network'

  export let pubkeys

  const relays = getUserRelays('read').concat(getTopRelays(pubkeys, 'write'))
  const people = database.watch('people', people => people.all({pubkey: pubkeys}))

  network.loadPeople(relays, pubkeys)
</script>

<Content gap={2}>
  {#each ($people || []) as person}
  <PersonInfo {person} />
  {/each}
</Content>
