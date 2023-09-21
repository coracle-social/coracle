<script lang="ts">
  import {onDestroy} from "svelte"
  import {now} from "src/util/misc"
  import {modal} from "src/partials/state"
  import QRCode from "src/partials/QRCode.svelte"
  import Content from "src/partials/Content.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Input from "src/partials/Input.svelte"
  import Textarea from "src/partials/Textarea.svelte"
  import {
    getSetting,
    displayPubkey,
    requestZap,
    collectInvoice,
    listenForZapResponse,
  } from "src/engine"

  export let pubkey
  export let note = null

  let sub
  let zap = {
    amount: getSetting("default_zap"),
    message: "",
    invoice: null,
    loading: false,
    startedAt: now(),
    confirmed: false,
  }

  const loadZapInvoice = async () => {
    zap.loading = true

    const {invoice, relays} = await requestZap(zap.message, zap.amount, {pubkey, event: note})

    // If they closed the dialog before fetch resolved, we're done
    if (!zap) {
      return
    }

    zap.invoice = invoice
    zap.loading = false

    await collectInvoice(invoice)

    // Listen for the zap confirmation
    sub = listenForZapResponse(pubkey, {
      relays,
      onEvent: event => {
        zap.confirmed = true
        setTimeout(() => modal.pop(), 1000)
        sub.close()
      },
    })
  }

  onDestroy(() => {
    sub?.close()
  })
</script>

<Content size="lg">
  <div class="text-center">
    <h1 class="staatliches text-2xl">Send a zap</h1>
    <p>to {displayPubkey(pubkey)}</p>
  </div>
  {#if zap.confirmed}
    <div class="flex items-center justify-center gap-2 text-gray-1">
      <i class="fa fa-champagne-glasses" />
      <p>Success! Zap confirmed.</p>
    </div>
  {:else if zap.invoice}
    <QRCode code={zap.invoice} />
    <p class="text-center text-gray-1">Copy or scan using a lightning wallet to pay your zap.</p>
    <div class="flex items-center justify-center gap-2 text-gray-1">
      <i class="fa fa-circle-notch fa-spin" />
      Waiting for confirmation...
    </div>
  {:else}
    <Textarea bind:value={zap.message} placeholder="Add an optional message" />
    <div class="flex items-center gap-2">
      <label class="flex-grow">Custom amount:</label>
      <Input bind:value={zap.amount}>
        <i slot="before" class="fa fa-bolt" />
        <span slot="after" class="-mt-1">sats</span>
      </Input>
      <Anchor loading={zap.loading} theme="button-accent" on:click={loadZapInvoice}>Zap!</Anchor>
    </div>
  {/if}
</Content>
