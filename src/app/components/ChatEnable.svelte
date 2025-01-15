<script lang="ts">
  import {goto} from "$app/navigation"
  import {WRAP} from "@welshman/util"
  import {repository} from "@welshman/app"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import Spinner from "@lib/components/Spinner.svelte"
  import ModalHeader from "@lib/components/ModalHeader.svelte"
  import ModalFooter from "@lib/components/ModalFooter.svelte"
  import {canDecrypt, PLATFORM_NAME, ensureUnwrapped} from "@app/state"
  import {clearModals} from "@app/modal"

  export let next

  let loading = false

  const enableChat = async () => {
    canDecrypt.set(true)

    for (const event of repository.query([{kinds: [WRAP]}])) {
      ensureUnwrapped(event)
    }

    clearModals()
    goto(next)
  }

  const submit = async () => {
    loading = true

    try {
      await enableChat()
    } finally {
      loading = false
    }
  }

  const back = () => history.back()
</script>

<form class="column gap-4" on:submit|preventDefault={submit}>
  <ModalHeader>
    <div slot="title">Enable Messages</div>
    <div slot="info">Do you want to enable direct messages?</div>
  </ModalHeader>
  <p>
    By default, direct messages are disabled, since loading them requires
    {PLATFORM_NAME} to download and decrypt a lot of data.
  </p>
  <p>
    If you'd like to enable them, please make sure your signer is set up to to auto-approve requests
    to decrypt data.
  </p>
  <ModalFooter>
    <Button class="btn btn-link" on:click={back}>
      <Icon icon="alt-arrow-left" />
      Go back
    </Button>
    <Button type="submit" class="btn btn-primary" disabled={loading}>
      <Spinner {loading}>Enable Messages</Spinner>
      <Icon icon="alt-arrow-right" />
    </Button>
  </ModalFooter>
</form>
