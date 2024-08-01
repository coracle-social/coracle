<script lang="ts">
  import {deriveEvent} from "@welshman/store"
  import Anchor from "src/partials/Anchor.svelte"
  import ListCard from "src/app/shared/ListCard.svelte"
  import {repository, pubkey} from "src/engine"
  import {router} from "src/app/util"

  export let address

  const event = deriveEvent(repository, address)
</script>

{#if $event}
  <ListCard {address}>
    <div slot="controls" class="flex gap-2">
      {#if $event.pubkey === $pubkey}
        <Anchor modal href={router.at("lists").of(address).at("edit").toString()}>
          <i class="fa fa-edit" /> Edit
        </Anchor>
      {/if}
    </div>
  </ListCard>
{:else}
  <p class="text-center">Sorry, we weren't able to find that list.</p>
{/if}
