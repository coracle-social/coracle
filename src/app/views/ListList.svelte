<script type="ts">
  import {indexBy} from "ramda"
  import {Tags} from "src/util/nostr"
  import {modal, appName} from "src/partials/state"
  import Heading from "src/partials/Heading.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Content from "src/partials/Content.svelte"
  import ListSummary from "src/app/shared/ListSummary.svelte"
  import user from "src/agent/user"

  const {lists} = user

  $: listsByName = indexBy(l => Tags.from(l).getMeta("d"), $lists)

  const createFeed = () => {
    modal.push({type: "list/edit"})
  }

  const removeList = e => {
    user.removeList(e.id)
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
  {#each $lists as e (e.id)}
    {@const meta = Tags.from(e).asMeta()}
    <div class="flex justify-start gap-3">
      <i
        class="fa fa-sm fa-trash cursor-pointer py-3"
        on:click|stopPropagation={() => removeList(e)} />
      <div class="flex w-full justify-between">
        <div>
          <strong>{meta.d}</strong>
          <ListSummary list={e} />
        </div>
        <Anchor class="underline" on:click={() => editList(e)}>Edit</Anchor>
      </div>
    </div>
  {:else}
    <p class="text-center py-12">You don't have any lists yet.</p>
  {/each}
</Content>
