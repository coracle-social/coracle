<script lang="ts">
  import {append, randomId} from "@welshman/lib"
  import {getAddress} from "@welshman/util"
  import {updateIn} from "src/util/misc"
  import Subheading from "src/partials/Subheading.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Content from "src/partials/Content.svelte"
  import ListCard from "src/app/shared/ListCard.svelte"
  import {router} from "src/app/util/router"
  import {pubkey, userLists} from "src/engine"

  export let type
  export let value

  const label = type === "p" ? "person" : "topic"

  const modifyList = updateIn("tags", tags => append([type, value], tags))

  const newList = () => ({address: `30003:${$pubkey}:${randomId()}`, tags: []})

  const selectlist = list => router.at("lists").of(getAddress(list.event)).at("edit").replaceModal()
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
  {#each $userLists as list (getAddress(list.event))}
    <ListCard address={getAddress(list.event)} />
  {:else}
    <p class="text-center py-12">You don't have any custom lists yet.</p>
  {/each}
</Content>
