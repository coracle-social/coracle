<script lang="ts">
  import {onMount, onDestroy} from "svelte"
  import {Nip46Broker, getPubkey, makeSecret} from "@welshman/signer"
  import {addSession} from "@welshman/app"
  import {preventDefault} from "@lib/html"
  import {slideAndFade} from "@lib/transition"
  import Spinner from "@lib/components/Spinner.svelte"
  import Button from "@lib/components/Button.svelte"
  import Field from "@lib/components/Field.svelte"
  import Icon from "@lib/components/Icon.svelte"
  import ModalHeader from "@lib/components/ModalHeader.svelte"
  import ModalFooter from "@lib/components/ModalFooter.svelte"
  import QRCode from "@app/components/QRCode.svelte"
  import InfoBunker from "@app/components/InfoBunker.svelte"
  import {loginWithNip46, loadUserData} from "@app/commands"
  import {pushModal, clearModals} from "@app/modal"
  import {setChecked} from "@app/notifications"
  import {pushToast} from "@app/toast"
  import {NIP46_PERMS, PLATFORM_URL, PLATFORM_NAME, PLATFORM_LOGO, SIGNER_RELAYS} from "@app/state"

  const clientSecret = makeSecret()

  const abortController = new AbortController()

  const broker = Nip46Broker.get({clientSecret, relays: SIGNER_RELAYS})

  const back = () => history.back()

  const onSubmit = async () => {
    const {signerPubkey, connectSecret, relays} = Nip46Broker.parseBunkerUrl(bunker)

    if (loading) {
      return
    }

    if (!signerPubkey || relays.length === 0) {
      return pushToast({
        theme: "error",
        message: "Sorry, it looks like that's an invalid bunker link.",
      })
    }

    loading = true

    try {
      const success = await loginWithNip46({connectSecret, clientSecret, signerPubkey, relays})

      if (success) {
        abortController.abort()
      } else {
        return pushToast({
          theme: "error",
          message: "Something went wrong, please try again!",
        })
      }
    } finally {
      loading = false
    }

    clearModals()
  }

  let url = $state("")
  let bunker = $state("")
  let loading = $state(false)

  $effect(() => {
    // For testing and for play store reviewers
    if (bunker === "reviewkey") {
      const secret = makeSecret()

      addSession({method: "nip01", secret, pubkey: getPubkey(secret)})
    }
  })

  onMount(async () => {
    url = await broker.makeNostrconnectUrl({
      perms: NIP46_PERMS,
      url: PLATFORM_URL,
      name: PLATFORM_NAME,
      image: PLATFORM_LOGO,
    })

    let response
    try {
      response = await broker.waitForNostrconnect(url, abortController)
    } catch (errorResponse: any) {
      if (errorResponse?.error) {
        pushToast({
          theme: "error",
          message: `Received error from signer: ${errorResponse.error}`,
        })
      } else if (errorResponse) {
        console.error(errorResponse)
      }
    }

    if (response) {
      loading = true

      const userPubkey = await broker.getPublicKey()

      await loadUserData(userPubkey)

      addSession({
        method: "nip46",
        pubkey: userPubkey,
        secret: clientSecret,
        handler: {
          pubkey: response.event.pubkey,
          relays: SIGNER_RELAYS,
        },
      })

      setChecked("*")
      clearModals()
    }
  })

  onDestroy(() => {
    abortController.abort()
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
  {#if !loading && url}
    <div class="flex justify-center" out:slideAndFade>
      <QRCode code={url} />
    </div>
  {/if}
  <Field>
    {#snippet label()}
      <p>Bunker Link*</p>
    {/snippet}
    {#snippet input()}
      <label class="input input-bordered flex w-full items-center gap-2">
        <Icon icon="cpu" />
        <input disabled={loading} bind:value={bunker} class="grow" placeholder="bunker://" />
      </label>
    {/snippet}
    {#snippet info()}
      <p>
        A login link provided by a nostr signing app.
        <Button class="link" onclick={() => pushModal(InfoBunker)}>What is a bunker link?</Button>
      </p>
    {/snippet}
  </Field>
  <ModalFooter>
    <Button class="btn btn-link" onclick={back} disabled={loading}>
      <Icon icon="alt-arrow-left" />
      Go back
    </Button>
    <Button type="submit" class="btn btn-primary" disabled={loading || !bunker}>
      <Spinner {loading}>Next</Spinner>
      <Icon icon="alt-arrow-right" />
    </Button>
  </ModalFooter>
</form>
