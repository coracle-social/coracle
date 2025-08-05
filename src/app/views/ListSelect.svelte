<script lang="ts">
  import {first} from "@welshman/lib"
  import {getAddress, getTags} from "@welshman/util"
  import {defaultTagFeedMappings} from "@welshman/feeds"
  import Subheading from "src/partials/Subheading.svelte"
  import Button from "src/partials/Button.svelte"
  import Card from "src/partials/Card.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import {router} from "src/app/util/router"
  import {userLists} from "src/engine"
  import {displayUserList} from "src/domain"
  import {quantify} from "src/util/misc"

  export let type
  export let value

  const tags = [[type, value]]

  const tagTypes = defaultTagFeedMappings.map(first) as string[]

  const createList = () => router.at("lists/create").cx({tags}).replaceModal()

  const selectList = list =>
    router.at("lists").of(getAddress(list.event)).at("edit").cx({tags}).replaceModal()
</script>

<FlexColumn>
  <div class="flex items-center justify-between">
    <Subheading>Select a List</Subheading>
    <Button class="btn btn-accent" on:click={createList}>
      <i class="fa fa-plus" /> List
    </Button>
  </div>
  <p>Select a list to add your selection to.</p>
  {#each $userLists as list (getAddress(list.event))}
    <Card interactive on:click={() => selectList(list)}>
      <FlexColumn>
        <div class="flex items-center justify-between">
          <span class="staatliches flex items-center gap-3 text-xl">
            <i class="fa fa-list" />
            <span class:text-neutral-400={!list.title}>
              {displayUserList(list)}
            </span>
          </span>
        </div>
        {#if list.description}
          <p>{list.description}</p>
        {/if}
        {quantify(getTags(tagTypes, list.tags).length, "item")}
      </FlexColumn>
    </Card>
  {:else}
    <p class="text-center py-12">You don't have any lists yet.</p>
  {/each}
</FlexColumn>
