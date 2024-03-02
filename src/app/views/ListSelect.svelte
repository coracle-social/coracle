<script lang="ts">
  import {append} from "ramda"
  import {randomId} from "hurdak"
  import {updateIn} from "src/util/misc"
  import Subheading from "src/partials/Subheading.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import BorderLeft from "src/partials/BorderLeft.svelte"
  import Content from "src/partials/Content.svelte"
  import ListSummary from "src/app/shared/ListSummary.svelte"
  import {router} from "src/app/router"
  import {pubkey, userLists} from "src/engine"

  export let type
  export let value

  const label = type === "p" ? "person" : "topic"

  const modifyList = updateIn("tags", append([type, value]))

  const newList = () => ({address: `30003:${$pubkey}:${randomId()}`, tags: []})

  const selectlist = list =>
    router
      .at("lists")
      .of(list.address)
      .cx({list: modifyList(list)})
      .replaceModal()
</script>

<Content size="lg">
  <div class="flex items-center justify-between">
    <Subheading>Select a List</Subheading>
    <Anchor button accent on:click={() => selectlist(newList())}>
      <i class="fa fa-plus" /> List
    </Anchor>
  </div>
  <p>
    Select a list to modify. The selected {label} will be added to it as an additional filter.
  </p>
  {#each $userLists as list (list.address)}
    <BorderLeft on:click={() => selectlist(list)}>
      <strong>{list.title}</strong>
      <ListSummary {list} />
    </BorderLeft>
  {:else}
    <p class="text-center py-12">You don't have any custom lists yet.</p>
  {/each}
</Content>
