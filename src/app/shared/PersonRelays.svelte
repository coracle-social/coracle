<script lang="ts">
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import RelayCard from "src/app/shared/RelayCard.svelte"

  export let relays
</script>

<FlexColumn>
  <p>
    Below are the relays this user publishes to. Join one or more to make sure you never miss their
    updates.
  </p>
  {#if relays.length === 0}
    <div class="pt-8 text-center">No relays found</div>
  {:else}
    <FlexColumn small>
      {#each relays as relay (relay.url)}
        <RelayCard {relay} />
      {/each}
    </FlexColumn>
  {/if}
</FlexColumn>
