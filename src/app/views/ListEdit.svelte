<script lang="ts">
  import {uniqBy, nth} from "@welshman/lib"
  import Subheading from "src/partials/Subheading.svelte"
  import ListForm from "src/app/shared/ListForm.svelte"
  import {router} from "src/app/util"
  import {readUserList} from "src/domain"
  import {deriveEvent} from "src/engine"

  export let address
  export let tags = []

  const event = deriveEvent(address)

  const exit = () => router.clearModals()

  const getList = () => ({
    ...readUserList($event),
    tags: uniqBy(nth(1), [...$event.tags, ...tags]),
  })
</script>

{#if $event}
  <Subheading class="text-center">Edit list</Subheading>
  <ListForm showDelete list={getList()} {exit} hide={["type"]} />
{:else}
  <p class="text-center">Sorry, we weren't able to find that list.</p>
{/if}
