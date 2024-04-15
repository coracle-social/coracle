<script type="ts">
  import {appName} from "src/partials/state"
  import Heading from "src/partials/Heading.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import ListSummary from "src/app/shared/ListSummary.svelte"
  import {router} from "src/app/util/router"
  import {userLists, publishDeletion} from "src/engine"

  const createFeed = () => router.at("lists/create").open()

  const editList = list => router.at("lists").of(list.address).open()
</script>

<div class="flex items-center justify-between">
  <Heading>Your Lists</Heading>
  <Anchor button accent on:click={createFeed}>
    <i class="fa fa-plus" /> List
  </Anchor>
</div>
<p>
  Lists allow you to group people and topics to create custom feeds. You can create new lists by
  handing using the "<i class="fa fa-plus" /> List" button above, or by clicking the
  <i class="fa fa-scroll px-1" /> icon that appears throughout {appName}.
</p>
{#each $userLists as list (list.address)}
  <div class="flex justify-start gap-3">
    <i
      class="fa fa-sm fa-trash cursor-pointer py-3"
      on:click|stopPropagation={() => publishDeletion([list.address])} />
    <div class="flex w-full justify-between">
      <div>
        <strong>{list.title}</strong>
        <ListSummary {list} />
      </div>
      <Anchor class="underline" on:click={() => editList(list)}>Edit</Anchor>
    </div>
  </div>
{:else}
  <p class="text-center py-12">You don't have any lists yet.</p>
{/each}
