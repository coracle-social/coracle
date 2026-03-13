<script lang="ts">
  import {_} from "svelte-i18n"
  import {debounce} from "throttle-debounce"
  import {onMount, onDestroy} from "svelte"
  import {makeSecret} from "@welshman/util"
  import {Nip46Broker} from "@welshman/signer"
  import {nip46Perms, loginWithNip46} from "@welshman/app"
  import {isKeyValid} from "src/util/nostr"
  import {showWarning} from "src/partials/Toast.svelte"
  import Input from "src/partials/Input.svelte"
  import QRCode from "src/partials/QRCode.svelte"
  import Link from "src/partials/Link.svelte"
  import Button from "src/partials/Button.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Heading from "src/partials/Heading.svelte"
  import Popover from "src/partials/Popover.svelte"
  import {env} from "src/engine"
  import {boot} from "src/app/state"

  let url = ""
  let input = ""
  let loading = false

  const clientSecret = makeSecret()

  const abortController = new AbortController()

  const back = () => history.back()

  // Because of ack responses, this sometimes gets called by both flows at once
  const finalize = debounce(300, async (broker: Nip46Broker, signerPubkey, relays) => {
    const pubkey = await broker.getPublicKey()

    if (pubkey) {
      loginWithNip46(pubkey, clientSecret, signerPubkey, relays)
      abortController.abort()
      broker.cleanup()
      boot()
    }
  })

  const logIn = async () => {
    loading = true

    try {
      const {signerPubkey, connectSecret, relays} = Nip46Broker.parseBunkerUrl(input)

      if (!isKeyValid(signerPubkey)) {
        return showWarning($_("login.invalidPublicKey"))
      }

      if (relays.length === 0) {
        return showWarning($_("login.noRelays"))
      }

      const broker = new Nip46Broker({relays, clientSecret, signerPubkey})
      const result = await broker.connect(connectSecret, nip46Perms)

      // TODO: remove ack result
      if (["ack", connectSecret].includes(result)) {
        finalize(broker, signerPubkey, relays)
      }
    } finally {
      loading = false
    }
  }

  onMount(async () => {
    const broker = new Nip46Broker({clientSecret, relays: env.SIGNER_RELAYS})

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
        showWarning($_("login.signerError", {values: {error: errorResponse.error}}))
      } else if (errorResponse) {
        console.error(errorResponse)
      }
    }

    if (response) {
      finalize(broker, response.event.pubkey, env.SIGNER_RELAYS)
    }
  })

  onDestroy(() => {
    abortController.abort()
  })
</script>

<FlexColumn class="max-w-md text-center">
  <Heading>{$_("login.bunkerTitle")}</Heading>
  <p>
    {$_("login.bunkerDescription")}
    <Link class="underline" modal href="/help/remote-signers">{$_("login.whatsASigner")}</Link>
  </p>
  {#if url}
    <Popover triggerType="mouseenter">
      <div slot="trigger">
        <QRCode code={url} />
      </div>
      <div slot="tooltip">{$_("login.bunkerTooltip")}</div>
    </Popover>
  {/if}
  <Input bind:value={input} placeholder="bunker://..." disabled={loading}>
    <i slot="before" class="fa fa-box" />
  </Input>
  <div class="flex gap-2">
    <Button class="btn" on:click={back} disabled={loading}
      ><i class="fa fa-arrow-left" /> {$_("common.back")}</Button>
    <Button class="btn btn-accent flex-grow" {loading} on:click={logIn}
      >{$_("common.continue")}</Button>
  </div>
</FlexColumn>
