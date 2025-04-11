<script lang="ts">
  import type {Nip46ResponseWithResult} from "@welshman/signer"
  import {Nip46Broker, makeSecret} from "@welshman/signer"
  import {loginWithNip01, loginWithNip46} from "@welshman/app"
  import {preventDefault} from "@lib/html"
  import Spinner from "@lib/components/Spinner.svelte"
  import Button from "@lib/components/Button.svelte"
  import Icon from "@lib/components/Icon.svelte"
  import ModalHeader from "@lib/components/ModalHeader.svelte"
  import ModalFooter from "@lib/components/ModalFooter.svelte"
  import BunkerConnect, {BunkerConnectController} from "@app/components/BunkerConnect.svelte"
  import BunkerUrl from "@app/components/BunkerUrl.svelte"
  import {loadUserData} from "@app/requests"
  import {clearModals} from "@app/modal"
  import {setChecked} from "@app/notifications"
  import {pushToast} from "@app/toast"
  import {SIGNER_RELAYS, NIP46_PERMS} from "@app/state"

  const back = () => history.back()

  const controller = new BunkerConnectController({
    onNostrConnect: async (response: Nip46ResponseWithResult) => {
      const pubkey = await controller.broker.getPublicKey()

      await loadUserData(pubkey)

      loginWithNip46(pubkey, controller.clientSecret, response.event.pubkey, SIGNER_RELAYS)
      setChecked("*")
      clearModals()
    },
  })

  const onSubmit = async () => {
    if (controller.loading) return

    const {signerPubkey, connectSecret, relays} = Nip46Broker.parseBunkerUrl(controller.bunker)

    if (!signerPubkey || relays.length === 0) {
      return pushToast({
        theme: "error",
        message: "Sorry, it looks like that's an invalid bunker link.",
      })
    }

    controller.loading = true

    try {
      const {clientSecret} = controller
      const broker = Nip46Broker.get({relays, clientSecret, signerPubkey})
      const result = await broker.connect(connectSecret, NIP46_PERMS)
      const pubkey = await broker.getPublicKey()

      // TODO: remove ack result
      if (pubkey && ["ack", connectSecret].includes(result)) {
        controller.stop()

        await loadUserData(pubkey)

        loginWithNip46(pubkey, clientSecret, signerPubkey, relays)
      } else {
        return pushToast({
          theme: "error",
          message: "Something went wrong, please try again!",
        })
      }
    } finally {
      controller.loading = false
    }

    clearModals()
  }

  $effect(() => {
    // For testing and for play store reviewers
    if (controller.bunker === "reviewkey") {
      loginWithNip01(makeSecret())
    }
  })
</script>

<form class="column gap-4" onsubmit={preventDefault(onSubmit)}>
  <ModalHeader>
    {#snippet title()}
      <div>Log In</div>
    {/snippet}
    {#snippet info()}
      <div>Connect your signer by scanning the QR code below or pasting a bunker link.</div>
    {/snippet}
  </ModalHeader>
  <BunkerConnect {controller} />
  <BunkerUrl loading={controller.loading} bind:bunker={controller.bunker} />
  <ModalFooter>
    <Button class="btn btn-link" onclick={back} disabled={controller.loading}>
      <Icon icon="alt-arrow-left" />
      Go back
    </Button>
    <Button
      type="submit"
      class="btn btn-primary"
      disabled={controller.loading || !controller.bunker}>
      <Spinner loading={controller.loading}>Next</Spinner>
      <Icon icon="alt-arrow-right" />
    </Button>
  </ModalFooter>
</form>
