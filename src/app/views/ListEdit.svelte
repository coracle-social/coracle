<script lang="ts">
  import ListForm from "src/app/shared/ListForm.svelte"
  import {router} from "src/app/util"
  import {readList} from "src/domain"
  import {repository} from "src/engine"

  export let address

  const event = repository.getEvent(address)

  const exit = () => router.clearModals()
</script>

{#if event}
  <ListForm list={readList(event)} {exit} />
{:else}
  <p class="text-center">Sorry, we weren't able to find that list.</p>
{/if}
