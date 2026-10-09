<script lang="ts">
  import {uniqBy, nth} from "@welshman/lib"
  import type {TrustedEvent} from "@welshman/util"
  import Subheading from "src/partials/Subheading.svelte"
  import ListForm from "src/app/shared/ListForm.svelte"
  import {router} from "src/app/util"
  import {readUserList} from "src/domain"
  import {deriveEvent} from "src/engine"

  export let address
  export let tags = []

  const event = deriveEvent(address)

  const exit = () => router.clearModals()

  const getList = async (e: TrustedEvent) => ({
    ...(await readUserList(e)),
    tags: uniqBy(nth(1), [...e.tags, ...tags]),
  })
</script>

{#if $event}
  <Subheading class="text-center">Edit list</Subheading>
  {#await getList($event) then list}
    <ListForm showDelete {list} {exit} hide={["type"]} />
  {:catch}
    <p class="text-center">Sorry, we weren't able to read that list.</p>
  {/await}
{:else}
  <p class="text-center">Sorry, we weren't able to find that list.</p>
{/if}
