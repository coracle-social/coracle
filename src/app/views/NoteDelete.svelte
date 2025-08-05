<script lang="ts">
  import Button from "src/partials/Button.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import {router} from "src/app/util/router"
  import {publishDeletion} from "src/engine"

  export let id
  export let kind

  const onCancel = () => router.pop()

  const onConfirm = () => {
    publishDeletion({kind, id})
    router.pop()
  }
</script>

<FlexColumn>
  <p class="flex items-center gap-4 text-xl">
    <i class="fa fa-triangle-exclamation" /> Are you sure you want to delete this event?
  </p>
  <p>
    This will send a request to the network to delete this event. Be aware that relays may not honor
    this request.
  </p>
  <div class="flex gap-2">
    <Button class="btn" on:click={onCancel}>Cancel</Button>
    <Button class="btn btn-danger" on:click={onConfirm}>Confirm</Button>
  </div>
</FlexColumn>
