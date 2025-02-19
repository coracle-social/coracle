<script lang="ts">
  import type {TrustedEvent} from "@welshman/util"
  import Confirm from "@lib/components/Confirm.svelte"
  import {publishDelete} from "@app/commands"
  import {clearModals} from "@app/modal"

  type Props = {
    url: string
    event: TrustedEvent
  }

  const {url, event}: Props = $props()

  const confirm = async () => {
    await publishDelete({event, relays: [url]})

    clearModals()
  }
</script>

<Confirm
  {confirm}
  title="Delete Message"
  subtitle="Are you sure you want to delete this message?"
  message="This will send a request to delete this message. Be aware that not all relays may honor this request." />
