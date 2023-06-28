<script lang="ts">
  import {modal} from "src/partials/state"
  import Anchor from "src/partials/Anchor.svelte"
  import Content from "src/partials/Content.svelte"
  import {getUserWriteRelays} from "src/agent/relays"
  import cmd from "src/agent/cmd"

  export let note

  const confirm = () => {
    cmd.deleteEvent([note.id]).publish(getUserWriteRelays())
    modal.pop()
  }
</script>

<Content size="lg">
  <div class="text-center">
    Notes cannot be reliably deleted on nostr, but you can ask. Are you sure you want to delete this
    note?
  </div>
  <div class="flex justify-center">
    <Anchor theme="button" on:click={confirm}>Confirm</Anchor>
  </div>
</Content>
