<script module lang="ts">
  import type {Nip46ResponseWithResult} from "@welshman/signer"
  import {Nip46Broker, makeSecret} from "@welshman/signer"
  import {NIP46_PERMS, PLATFORM_URL, PLATFORM_NAME, PLATFORM_LOGO, SIGNER_RELAYS} from "@app/state"

  export class BunkerConnectController {
    url = $state("")
    bunker = $state("")
    loading = $state(false)
    clientSecret = makeSecret()
    abortController = new AbortController()
    broker = Nip46Broker.get({clientSecret: this.clientSecret, relays: SIGNER_RELAYS})
    onNostrConnect: (response: Nip46ResponseWithResult) => void

    constructor({onNostrConnect}: {onNostrConnect: (response: Nip46ResponseWithResult) => void}) {
      this.onNostrConnect = onNostrConnect
    }

    async start() {
      this.url = await this.broker.makeNostrconnectUrl({
        perms: NIP46_PERMS,
        url: PLATFORM_URL,
        name: PLATFORM_NAME,
        image: PLATFORM_LOGO,
      })

      let response
      try {
        response = await this.broker.waitForNostrconnect(this.url, this.abortController.signal)
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
        this.loading = true
        this.onNostrConnect(response)
      }
    }

    stop() {
      this.abortController.abort()
    }
  }
</script>

<script lang="ts">
  import {onMount, onDestroy} from "svelte"
  import {slideAndFade} from "@lib/transition"
  import QRCode from "@app/components/QRCode.svelte"
  import {pushToast} from "@app/toast"

  type Props = {
    controller: BunkerConnectController
  }

  const {controller}: Props = $props()

  onMount(() => {
    controller.start()
  })

  onDestroy(() => {
    controller.stop()
  })
</script>

{#if controller.url}
  <div class="flex justify-center" out:slideAndFade>
    <QRCode code={controller.url} />
  </div>
{/if}
