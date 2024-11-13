<script lang="ts">
  import {onDestroy} from "svelte"
  import {Nip46Broker} from "@welshman/signer"
  import {addSession, nip46Perms} from "@welshman/app"
  import {normalizeRelayUrl} from "@welshman/util"
  import {isKeyValid} from "src/util/nostr"
  import {showWarning} from "src/partials/Toast.svelte"
  import Input from "src/partials/Input.svelte"
  import QRCode from "src/partials/QRCode.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Heading from "src/partials/Heading.svelte"
  import {env, loginWithNip46} from "src/engine"
  import {boot} from "src/app/state"

  let input = ""
  let loading = false

  const abortController = new AbortController()

  const init = Nip46Broker.initiate({
    perms: nip46Perms,
    url: env.APP_URL,
    name: env.APP_NAME,
    relays: env.SIGNER_RELAYS,
    image: env.APP_URL + env.APP_LOGO,
    abortController,
  })

  const back = () => history.back()

  const logIn = async () => {
    loading = true

    try {
      const {pubkey, token, relays} = await Nip46Broker.parseBunkerLink(input)

      if (!isKeyValid(pubkey)) {
        return showWarning("Sorry, but that's an invalid public key.")
      }

      if (relays.length === 0) {
        return showWarning("That connection string doesn't have any relays.")
      }

      const success = await loginWithNip46(token, {pubkey, relays: relays.map(normalizeRelayUrl)})

      if (success) {
        boot()
      }
    } finally {
      loading = false
    }
  }

  init.result.then(pubkey => {
    if (pubkey) {
      addSession({
        pubkey,
        method: "nip46",
        secret: init.clientSecret,
        handler: {pubkey, relays: env.SIGNER_RELAYS},
      })

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
  <QRCode code={init.nostrconnect} />
  <Input bind:value={input} placeholder="bunker://..." disabled={loading}>
    <i slot="before" class="fa fa-box" />
  </Input>
  <div class="flex gap-2">
    <Anchor button on:click={back} disabled={loading}><i class="fa fa-arrow-left" /> Back</Anchor>
    <Anchor button accent class="flex-grow" {loading} on:click={logIn}>Continue</Anchor>
  </div>
</FlexColumn>
