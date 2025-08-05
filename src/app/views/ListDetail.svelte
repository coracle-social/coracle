<script lang="ts">
  import {pubkey} from "@welshman/app"
  import Link from "src/partials/Link.svelte"
  import ListCard from "src/app/shared/ListCard.svelte"
  import {router} from "src/app/util"
  import {deriveEvent} from "src/engine"

  export let address

  const event = deriveEvent(address)
</script>

{#if $event}
  <ListCard {address}>
    <div slot="controls" class="flex gap-2">
      {#if $event.pubkey === $pubkey}
        <Link modal href={router.at("lists").of(address).at("edit").toString()}>
          <i class="fa fa-edit" /> Edit
        </Link>
      {/if}
    </div>
  </ListCard>
{:else}
  <p class="text-center">Sorry, we weren't able to find that list.</p>
{/if}
