<script>
  import {fly} from 'svelte/transition'
  import Content from "src/partials/Content.svelte"
  import RelayCard from "src/partials/RelayCard.svelte"

  export let person
</script>

<div in:fly={{y: 20}}>
  <Content>
    <p>
      Below are the relays this user publishes to. Join one or more to make sure you never
      miss their updates.
    </p>
    {#if (person.relays || []).length === 0}
    <div class="pt-8 text-center">No relays found</div>
    {:else}
      {#each person.relays as relay, i (relay.url)}
      {#if relay.write !== '!'}
      <RelayCard {relay} {i} />
      {/if}
      {/each}
    {/if}
  </Content>
</div>
