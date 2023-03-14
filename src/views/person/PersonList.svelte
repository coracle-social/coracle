<script type="ts">
  import Content from "src/partials/Content.svelte"
  import PersonInfo from "src/views/person/PersonInfo.svelte"
  import {getPersonWithFallback} from "src/agent/state"
  import {watch} from "src/agent/table"
  import network from "src/agent/network"

  export let pubkeys

  const people = watch("people", t => pubkeys.map(getPersonWithFallback))

  network.loadPeople(pubkeys)
</script>

<Content gap={2}>
  {#each $people || [] as person}
    <PersonInfo {person} />
  {/each}
</Content>
