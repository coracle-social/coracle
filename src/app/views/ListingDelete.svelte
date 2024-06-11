<script lang="ts">
  import Anchor from "src/partials/Anchor.svelte"
  import Content from "src/partials/Content.svelte"
  import {router} from "src/app/util/router"
  import {deleteEventByAddress} from "src/engine"

  export let address

  const onCancel = () => router.pop()

  const onConfirm = () => {
    deleteEventByAddress(address)
    router.pop()
  }
</script>

<Content size="lg">
  <p class="flex items-center gap-4 text-xl">
    <i class="fa fa-triangle-exclamation" /> Are you sure you want to delete this listing?
  </p>
  <p>
    This will send a request to the network to delete this listing. Be aware that relays may not
    honor this request.
  </p>
  <div class="flex gap-2">
    <Anchor button on:click={onCancel}>Cancel</Anchor>
    <Anchor button danger on:click={onConfirm}>Confirm</Anchor>
  </div>
</Content>
