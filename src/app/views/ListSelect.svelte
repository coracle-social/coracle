<script lang="ts">
  import {updateIn} from "hurdak"
  import {Tags} from "src/util/nostr"
  import Heading from "src/partials/Heading.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import BorderLeft from "src/partials/BorderLeft.svelte"
  import Content from "src/partials/Content.svelte"
  import ListSummary from "src/app/shared/ListSummary.svelte"
  import {router} from "src/app/router"
  import {userLists} from "src/engine"

  export let type
  export let value

  const label = type === "p" ? "person" : "topic"

  const modifyList = updateIn("tags", (tags: string[][] = []) => [...tags, [type, value]])

  const selectlist = list =>
    router
      .at("lists")
      .of(list.naddr)
      .cx({list: modifyList(list)})
      .replaceModal()
</script>

<Content size="lg">
  <div class="flex items-center justify-between">
    <Heading>Select a List</Heading>
    <Anchor theme="button-accent" on:click={() => selectlist({})}>
      <i class="fa fa-plus" /> List
    </Anchor>
  </div>
  <p>
    Select a list to modify. The selected {label} will be added to it as an additional filter.
  </p>
  {#each $userLists as list (list.naddr)}
    {@const meta = Tags.wrap(list.tags).asMeta()}
    <BorderLeft on:click={() => selectlist(list)}>
      <strong>{meta.d}</strong>
      <ListSummary {list} />
    </BorderLeft>
  {:else}
    <p class="text-center py-12">You don't have any custom lists yet.</p>
  {/each}
</Content>
