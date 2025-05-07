<script lang="ts">
  import {onMount, onDestroy} from "svelte"
  import {Nip46Broker, makeSecret} from "@welshman/signer"
  import {nip46Perms, loginWithNip46} from "@welshman/app"
  import {info} from "src/util/logger"
  import {isKeyValid} from "src/util/nostr"
  import {showWarning} from "src/partials/Toast.svelte"
  import Input from "src/partials/Input.svelte"
  import QRCode from "src/partials/QRCode.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Heading from "src/partials/Heading.svelte"
  import {env} from "src/engine"
  import {boot} from "src/app/state"

  let url = ""
  let input = ""
  let loading = false

  const clientSecret = makeSecret()

  const abortController = new AbortController()

  const back = () => history.back()

  const logIn = async () => {
    loading = true

    try {
      const {signerPubkey, connectSecret, relays} = Nip46Broker.parseBunkerUrl(input)

      if (!isKeyValid(signerPubkey)) {
        return showWarning("Sorry, but that's an invalid public key.")
      }

      if (relays.length === 0) {
        return showWarning("That connection string doesn't have any relays.")
      }

      const broker = Nip46Broker.get({relays, clientSecret, signerPubkey, debug: info})
      const result = await broker.connect(connectSecret, nip46Perms)
      const pubkey = await broker.getPublicKey()

      // TODO: remove ack result
      if (pubkey && ["ack", connectSecret].includes(result)) {
        loginWithNip46(pubkey, clientSecret, signerPubkey, relays)
        abortController.abort()
        boot()
      }
    } finally {
      loading = false
    }
  }

  onMount(async () => {
    const broker = Nip46Broker.get({clientSecret, relays: env.SIGNER_RELAYS, debug: info})

    url = await broker.makeNostrconnectUrl({
      url: env.APP_URL,
      name: env.APP_NAME,
      image: env.APP_URL + env.APP_LOGO,
      perms: nip46Perms,
    })

    let response
    try {
      response = await broker.waitForNostrconnect(url, abortController.signal)
    } catch (errorResponse: any) {
      if (errorResponse?.error) {
        showWarning(`Received error from signer: ${errorResponse.error}`)
      } else if (errorResponse) {
        console.error(errorResponse)
      }
    }

    if (response) {
      const pubkey = await broker.getPublicKey()

      loginWithNip46(pubkey, clientSecret, response.event.pubkey, env.SIGNER_RELAYS)
      boot()
    }
  })

  onDestroy(() => {
    abortController.abort()
  })
</script>

<FlexColumn class="max-w-md text-center">
  <Heading>Login with Signer</Heading>
  <p>
    To log in using a remote signer, scan the QR code below or enter a connection link.
    <Anchor underline modal href="/help/remote-signers">What's a signer?</Anchor>
  </p>
  {#if url}
    <QRCode code={url} />
  {/if}
  <Input bind:value={input} placeholder="bunker://..." disabled={loading}>
    <i slot="before" class="fa fa-box" />
  </Input>
  <div class="flex gap-2">
    <Anchor button on:click={back} disabled={loading}><i class="fa fa-arrow-left" /> Back</Anchor>
    <Anchor button accent class="flex-grow" {loading} on:click={logIn}>Continue</Anchor>
  </div>
</FlexColumn>
