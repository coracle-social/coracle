<script>
  import {fly} from "src/util/transition"
  import Content from "src/partials/Content.svelte"
  import RelayCard from "src/app/shared/RelayCard.svelte"

  export let relays
</script>

<div in:fly={{y: 20}}>
  <Content>
    <p>
      Below are the relays this user publishes to. Join one or more to make sure you never miss
      their updates.
    </p>
    {#if relays.length === 0}
      <div class="pt-8 text-center">No relays found</div>
    {:else}
      {#each relays as relay (relay.url)}
        <RelayCard {relay} />
      {/each}
    {/if}
  </Content>
</div>
