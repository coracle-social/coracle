<script lang="ts">
  import {uniqBy, nth} from "@welshman/lib"
  import Subheading from "src/partials/Subheading.svelte"
  import ListForm from "src/app/shared/ListForm.svelte"
  import {router} from "src/app/util"
  import {readList} from "src/domain"
  import {repository} from "src/engine"

  export let address
  export let tags = []

  const event = repository.getEvent(address)

  const list = {...readList(event), tags: uniqBy(nth(1), [...event.tags, ...tags])}

  const exit = () => router.clearModals()
</script>

{#if event}
  <Subheading class="text-center">Edit list</Subheading>
  <ListForm showDelete {list} {exit} hide={["type"]} />
{:else}
  <p class="text-center">Sorry, we weren't able to find that list.</p>
{/if}
