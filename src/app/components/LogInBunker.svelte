<script lang="ts">
  import {Nip46Broker} from "@welshman/signer"
  import Spinner from "@lib/components/Spinner.svelte"
  import Button from "@lib/components/Button.svelte"
  import Field from "@lib/components/Field.svelte"
  import Icon from "@lib/components/Icon.svelte"
  import ModalHeader from "@lib/components/ModalHeader.svelte"
  import ModalFooter from "@lib/components/ModalFooter.svelte"
  import InfoBunker from "@app/components/InfoBunker.svelte"
  import {loginWithNip46, loadUserData} from "@app/commands"
  import {pushModal, clearModals} from "@app/modal"
  import {pushToast} from "@app/toast"
  import {PLATFORM_NAME} from "@app/state"

  const back = () => history.back()

  const onSubmit = async () => {
    const {pubkey, token, relays} = Nip46Broker.parseBunkerLink(bunker)

    if (!pubkey || relays.length === 0) {
      return pushToast({
        theme: "error",
        message: "Sorry, it looks like that's an invalid bunker link.",
      })
    }

    loading = true

    try {
      if (!(await loginWithNip46(token, {pubkey, relays}))) {
        return pushToast({
          theme: "error",
          message: "Something went wrong, please try again!",
        })
      }

      await loadUserData(pubkey)
    } finally {
      loading = false
    }

    clearModals()
  }

  let bunker = ""
  let loading = false
</script>

<form class="column gap-4" on:submit|preventDefault={onSubmit}>
  <ModalHeader>
    <div slot="title">Log In</div>
    <div slot="info">Connect your signer app with {PLATFORM_NAME} using a bunker link.</div>
  </ModalHeader>
  <Field>
    <p slot="label">Bunker Link*</p>
    <label class="input input-bordered flex w-full items-center gap-2" slot="input">
      <Icon icon="cpu" />
      <input bind:value={bunker} class="grow" placeholder="bunker://" />
    </label>
    <p slot="info">
      A login link provided by a nostr signing app.
      <Button class="link" on:click={() => pushModal(InfoBunker)}>What is a bunker link?</Button>
    </p>
  </Field>
  <ModalFooter>
    <Button class="btn btn-link" on:click={back}>
      <Icon icon="alt-arrow-left" />
      Go back
    </Button>
    <Button type="submit" class="btn btn-primary" disabled={loading || !bunker}>
      <Spinner {loading}>Next</Spinner>
      <Icon icon="alt-arrow-right" />
    </Button>
  </ModalFooter>
</form>
