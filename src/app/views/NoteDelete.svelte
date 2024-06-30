<script lang="ts">
  import Anchor from "src/partials/Anchor.svelte"
  import Content from "src/partials/Content.svelte"
  import {router} from "src/app/util/router"
  import {deleteEventById} from "src/engine"

  const onCancel = () => router.pop()

  const onConfirm = () => {
    deleteEventById($$props.eid)
    router.pop()
  }
</script>

<Content size="lg">
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
</Content>
