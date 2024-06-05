<script lang="ts">
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import RelayCard from "src/app/shared/RelayCard.svelte"

  export let urls
</script>

<FlexColumn>
  <p>
    Below are the relays this user publishes to. Join one or more to make sure you never miss their
    updates.
  </p>
  {#if urls.length === 0}
    <div class="pt-8 text-center">No relays found</div>
  {:else}
    <FlexColumn small>
      {#each urls as url (url)}
        <RelayCard {url} />
      {/each}
    </FlexColumn>
  {/if}
</FlexColumn>
