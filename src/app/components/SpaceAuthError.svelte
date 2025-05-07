<script lang="ts">
  import {displayRelayUrl} from "@welshman/util"
  import {parse, renderAsHtml} from "@welshman/content"
  import Spinner from "@lib/components/Spinner.svelte"
  import Button from "@lib/components/Button.svelte"
  import Icon from "@lib/components/Icon.svelte"
  import {preventDefault} from "@lib/html"
  import {ucFirst} from "@lib/util"
  import ModalHeader from "@lib/components/ModalHeader.svelte"
  import ModalFooter from "@lib/components/ModalFooter.svelte"
  import {pushToast} from "@app/toast"
  import {clearModals} from "@app/modal"
  import {attemptRelayAccess} from "@app/commands"

  const {url, error} = $props()

  const back = () => history.back()

  const joinRelay = async () => {
    const error = await attemptRelayAccess(url)

    if (error) {
      return pushToast({theme: "error", message: error})
    }

    pushToast({
      message: "You have successfully joined the space!",
    })

    clearModals()
  }

  const join = async () => {
    loading = true

    try {
      await joinRelay()
    } finally {
      loading = false
    }
  }

  let loading = $state(false)
</script>

<form class="column gap-4" onsubmit={preventDefault(join)}>
  <ModalHeader>
    {#snippet title()}
      <div>Access Error</div>
    {/snippet}
    {#snippet info()}
      <div>We couldn't connect you to this space.</div>
    {/snippet}
  </ModalHeader>
  <p>
    We received an error from the relay indicating you don't have access to {displayRelayUrl(url)}:
  </p>
  <p class="bg-alt card2 welshman-content">
    {@html renderAsHtml(parse({content: ucFirst(error)}))}
  </p>
  <ModalFooter>
    <Button class="btn btn-link" onclick={back}>
      <Icon icon="alt-arrow-left" />
      Go back
    </Button>
    <Button type="submit" class="btn btn-primary" disabled={loading}>
      <Spinner {loading}>Request Access</Spinner>
      <Icon icon="alt-arrow-right" />
    </Button>
  </ModalFooter>
</form>
