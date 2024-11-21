<script lang="ts">
  import {PublishStatus} from "@welshman/net"
  import {displayRelayUrl} from "@welshman/util"
  import Button from "@lib/components/Button.svelte"

  export let url: string
  export let status: string
  export let message: string
  export let retry: () => void

  $: {
    if (!message && status === PublishStatus.Timeout) {
      message = "request timed out"
    }

    if (!message) {
      message = "no details recieved"
    }
  }
</script>

<div class="card2 bg-alt col-2 shadow-2xl">
  <p>
    Failed to publish to {displayRelayUrl(url)}: {message}.
  </p>
  <Button class="link" on:click={retry}>Retry</Button>
</div>
