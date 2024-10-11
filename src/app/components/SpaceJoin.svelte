<script lang="ts">
  import {displayRelayUrl} from "@welshman/util"
  import Spinner from "@lib/components/Spinner.svelte"
  import Button from "@lib/components/Button.svelte"
  import Icon from "@lib/components/Icon.svelte"
  import ModalHeader from "@lib/components/ModalHeader.svelte"
  import ModalFooter from "@lib/components/ModalFooter.svelte"
  import {clearModal} from "@app/modal"
  import {addSpaceMembership} from "@app/commands"

  export let url

  const back = () => history.back()

  const tryJoin = async () => {
    await addSpaceMembership(url)

    clearModal()
  }

  const join = async () => {
    loading = true

    try {
      await tryJoin()
    } catch (e) {
      loading = false
    }
  }

  let loading = false
</script>

<form class="column gap-4" on:submit|preventDefault={join}>
  <ModalHeader>
    <div slot="title">
      Joining <span class="text-primary">{displayRelayUrl(url)}</span>
    </div>
    <div slot="info">Are you sure you'd like to join this space?</div>
  </ModalHeader>
  <ModalFooter>
    <Button class="btn btn-link" on:click={back}>
      <Icon icon="alt-arrow-left" />
      Go back
    </Button>
    <Button type="submit" class="btn btn-primary" disabled={loading}>
      <Spinner {loading}>Join Space</Spinner>
      <Icon icon="alt-arrow-right" />
    </Button>
  </ModalFooter>
</form>
