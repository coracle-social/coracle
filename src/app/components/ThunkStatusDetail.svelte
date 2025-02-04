<script lang="ts">
  import {PublishStatus} from "@welshman/net"
  import {displayRelayUrl} from "@welshman/util"
  import Button from "@lib/components/Button.svelte"

  interface Props {
    url: string
    status: string
    message: string
    retry: () => void
  }

  let {url, status, message = $bindable(), retry}: Props = $props()

  $effect(() => {
    if (!message && status === PublishStatus.Timeout) {
      message = "request timed out"
    }

    if (!message) {
      message = "no details recieved"
    }
  })
</script>

<div class="card2 bg-alt col-2 shadow-2xl">
  <p>
    Failed to publish to {displayRelayUrl(url)}: {message}.
  </p>
  <Button class="link" onclick={retry}>Retry</Button>
</div>
