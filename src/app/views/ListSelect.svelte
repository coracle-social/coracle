<script type="ts">
  import {updateIn} from "hurdak/lib/hurdak"
  import {Tags} from "src/util/nostr"
  import {modal} from "src/partials/state"
  import Heading from "src/partials/Heading.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import BorderLeft from "src/partials/BorderLeft.svelte"
  import Content from "src/partials/Content.svelte"
  import ListSummary from "src/app/shared/ListSummary.svelte"
  import user from "src/agent/user"

  export let item

  const {lists} = user
  const label = item.type === "p" ? "person" : "topic"

  const modifyList = updateIn("tags", tags => (tags || []).concat([[item.type, item.value]]))

  const selectlist = list => {
    modal.replace({type: "list/edit", list: modifyList(list)})
  }
</script>

<Content size="lg">
  <div class="flex items-center justify-between">
    <Heading>Select a List</Heading>
    <Anchor type="button-accent" on:click={() => selectlist({})}>
      <i class="fa fa-plus" /> List
    </Anchor>
  </div>
  <p>
    Select a list to modify. The selected {label} will be added to it as an additional filter.
  </p>
  {#each $lists as e (e.id)}
    {@const meta = Tags.from(e).asMeta()}
    <BorderLeft on:click={() => selectlist(e)}>
      <strong>{meta.d}</strong>
      <ListSummary list={e} />
    </BorderLeft>
  {:else}
    <p class="text-center py-12">You don't have any custom lists yet.</p>
  {/each}
</Content>
