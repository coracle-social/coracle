<script lang="ts">
  import {getAddress} from "@welshman/util"
  import {fly} from "src/util/transition"
  import Subheading from "src/partials/Subheading.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import ListCard from "src/app/shared/ListCard.svelte"
  import {router} from "src/app/util/router"
  import {userLists} from "src/engine"

  const createList = () => router.at("lists/create").open()

  const editList = address => router.at("lists").of(address).at('edit').open()
</script>

<div class="flex items-center justify-between">
  <Subheading>Your Lists</Subheading>
  <Anchor button accent on:click={createList}>
    <i class="fa fa-plus" /> List
  </Anchor>
</div>
{#each $userLists as list}
  {@const address = getAddress(list.event)}
  <div in:fly={{y: 20}}>
    <ListCard {address}>
      <div slot="controls">
        <Anchor on:click={() => editList(address)}>
          <i class="fa fa-edit" /> Edit
        </Anchor>
      </div>
    </ListCard>
  </div>
{/each}
{#if $userLists.length === 0}
  <p class="py-12 text-center">No lists found.</p>
{/if}
