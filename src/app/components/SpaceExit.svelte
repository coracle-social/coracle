<script lang="ts">
  import {goto} from "$app/navigation"
  import {displayRelayUrl} from "@welshman/util"
  import {preventDefault} from "@lib/html"
  import Spinner from "@lib/components/Spinner.svelte"
  import Button from "@lib/components/Button.svelte"
  import Icon from "@lib/components/Icon.svelte"
  import ModalHeader from "@lib/components/ModalHeader.svelte"
  import ModalFooter from "@lib/components/ModalFooter.svelte"
  import {removeSpaceMembership} from "@app/commands"

  const {url} = $props()

  const back = () => history.back()

  const exit = async () => {
    loading = true

    try {
      await removeSpaceMembership(url)
    } finally {
      loading = false
    }

    goto("/home")
  }

  let loading = $state(false)
</script>

<form class="column gap-4" onsubmit={preventDefault(exit)}>
  <ModalHeader>
    {#snippet title()}
      <div>
        You are leaving<br /><span class="text-primary">{displayRelayUrl(url)}</span>
      </div>
    {/snippet}
  </ModalHeader>
  <p class="text-center">Are you sure you want to leave?</p>
  <ModalFooter>
    <Button class="btn btn-link" onclick={back}>
      <Icon icon="alt-arrow-left" />
      Go back
    </Button>
    <Button type="submit" class="btn btn-primary" disabled={loading}>
      <Spinner {loading}>Confirm</Spinner>
    </Button>
  </ModalFooter>
</form>
