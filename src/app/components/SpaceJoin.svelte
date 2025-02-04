<script lang="ts">
  import {displayRelayUrl} from "@welshman/util"
  import {preventDefault} from "@lib/html"
  import Spinner from "@lib/components/Spinner.svelte"
  import Button from "@lib/components/Button.svelte"
  import Icon from "@lib/components/Icon.svelte"
  import ModalHeader from "@lib/components/ModalHeader.svelte"
  import ModalFooter from "@lib/components/ModalFooter.svelte"
  import {clearModals} from "@app/modal"
  import {addSpaceMembership} from "@app/commands"

  const {url} = $props()

  const back = () => history.back()

  const tryJoin = async () => {
    await addSpaceMembership(url)

    clearModals()
  }

  const join = async () => {
    loading = true

    try {
      await tryJoin()
    } catch (e) {
      loading = false
    }
  }

  let loading = $state(false)
</script>

<form class="column gap-4" onsubmit={preventDefault(join)}>
  <ModalHeader>
    {#snippet title()}
      <div>
        Joining <span class="text-primary">{displayRelayUrl(url)}</span>
      </div>
    {/snippet}
    {#snippet info()}
      <div>Are you sure you'd like to join this space?</div>
    {/snippet}
  </ModalHeader>
  <ModalFooter>
    <Button class="btn btn-link" onclick={back}>
      <Icon icon="alt-arrow-left" />
      Go back
    </Button>
    <Button type="submit" class="btn btn-primary" disabled={loading}>
      <Spinner {loading}>Join Space</Spinner>
      <Icon icon="alt-arrow-right" />
    </Button>
  </ModalFooter>
</form>
