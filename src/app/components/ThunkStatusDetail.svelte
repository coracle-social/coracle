<script lang="ts">
  import {PublishStatus} from '@welshman/net'
  import {displayRelayUrl} from '@welshman/util'
  import Button from '@lib/components/Button.svelte'

  export let url
  export let status
  export let message
  export let retry

  if (!message && status === PublishStatus.Timeout) {
    message = "request timed out"
  }
</script>

<div class="card2 bg-alt col-2">
  <p>
    Failed to publish to {displayRelayUrl(url)}: {message}.
  </p>
  <Button class="link" on:click={retry}>Retry</Button>
</div>
