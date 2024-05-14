<script lang="ts">
  import ListCard from "src/app/shared/ListCard.svelte"
  import PersonBadgeSmall from "src/app/shared/PersonBadgeSmall.svelte"
  import {repository} from "src/engine"

  export let address

  const event = repository.getEvent(address)
</script>

{#if event}
  <ListCard {address}>
    <div slot="controls" class="flex gap-2">
      Created by
      <PersonBadgeSmall inert pubkey={event.pubkey} />
    </div>
  </ListCard>
{:else}
  <p class="text-center">Sorry, we weren't able to find that list.</p>
{/if}
