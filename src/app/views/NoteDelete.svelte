<script lang="ts">
  import Anchor from "src/partials/Anchor.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import {router} from "src/app/util/router"
  import {deleteEvent} from "src/engine"

  export let eid
  export let kind

  const onCancel = () => router.pop()

  const onConfirm = () => {
    deleteEvent({kind, id: eid})
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
    <Anchor button on:click={onCancel}>Cancel</Anchor>
    <Anchor button danger on:click={onConfirm}>Confirm</Anchor>
  </div>
</FlexColumn>
