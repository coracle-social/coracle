<script lang="ts">
  import Confirm from "@lib/components/Confirm.svelte"
  import {publishDelete} from "@app/commands"
  import {clearModals} from "@app/modal"

  const {url, event} = $props()

  const confirm = async () => {
    const snapshot = $state.snapshot(event)

    await publishDelete({event: snapshot, relays: [url]})

    clearModals()
  }
</script>

<Confirm
  {confirm}
  title="Delete Message"
  subtitle="Are you sure you want to delete this message?"
  message="This will send a request to delete this message. Be aware that not all relays may honor this request." />
