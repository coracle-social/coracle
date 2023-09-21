<script type="ts">
  import {modal, appName} from "src/partials/state"
  import Heading from "src/partials/Heading.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Content from "src/partials/Content.svelte"
  import ListSummary from "src/app/shared/ListSummary.svelte"
  import {userLists, publishDeletion} from "src/engine"

  const createFeed = () => {
    modal.push({type: "list/edit"})
  }

  const editList = list => {
    modal.push({type: "list/edit", list})
  }
</script>

<Content>
  <div class="flex items-center justify-between">
    <Heading>Your Lists</Heading>
    <Anchor theme="button-accent" on:click={createFeed}>
      <i class="fa fa-plus" /> List
    </Anchor>
  </div>
  <p>
    Lists allow you to group people and topics to create custom feeds. You can create new lists by
    handing using the "<i class="fa fa-plus" /> List" button above, or by clicking the
    <i class="fa fa-scroll px-1" /> icon that appears throughout {appName}.
  </p>
  {#each $userLists as list (list.naddr)}
    <div class="flex justify-start gap-3">
      <i
        class="fa fa-sm fa-trash cursor-pointer py-3"
        on:click|stopPropagation={() => publishDeletion([list.naddr])} />
      <div class="flex w-full justify-between">
        <div>
          <strong>{list.name}</strong>
          <ListSummary {list} />
        </div>
        <Anchor class="underline" on:click={() => editList(list)}>Edit</Anchor>
      </div>
    </div>
  {:else}
    <p class="text-center py-12">You don't have any lists yet.</p>
  {/each}
</Content>
