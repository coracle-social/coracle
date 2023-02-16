<script type="ts">
  import Content from 'src/partials/Content.svelte'
  import PersonInfo from 'src/partials/PersonInfo.svelte'
  import {getAllPubkeyWriteRelays} from 'src/agent/relays'
  import database from 'src/agent/database'
  import network from 'src/agent/network'

  export let pubkeys

  const relays = getAllPubkeyWriteRelays(pubkeys)
  const people = database.watch('people', people => people.all({pubkey: pubkeys}))

  network.loadPeople(relays, pubkeys)
</script>

<Content gap={2}>
  {#each ($people || []) as person}
  <PersonInfo {person} />
  {/each}
</Content>
