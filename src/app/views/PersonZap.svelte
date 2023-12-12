<script lang="ts">
  import {onDestroy} from "svelte"
  import {now} from "paravel"
  import QRCode from "src/partials/QRCode.svelte"
  import Content from "src/partials/Content.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Input from "src/partials/Input.svelte"
  import Textarea from "src/partials/Textarea.svelte"
  import {router} from "src/app/router"
  import {
    getSetting,
    displayPubkey,
    requestZap,
    collectInvoice,
    selectHints,
    getPubkeyHints,
    listenForZapResponse,
  } from "src/engine"

  export let pubkey
  export let eid = null
  export let relays = null
  export let lnurl = null

  let sub, unmounted
  let zap = {
    amount: getSetting("default_zap"),
    message: "",
    invoice: null,
    loading: false,
    startedAt: now(),
    confirmed: false,
  }

  const hints = selectHints(relays || getPubkeyHints(pubkey))

  const loadZapInvoice = async () => {
    zap.loading = true

    const invoice = await requestZap(zap.message, zap.amount, {
      eid,
      lnurl,
      pubkey,
      relays: hints,
    })

    // If they closed the dialog before fetch resolved, we're done
    if (!zap) {
      return
    }

    zap.invoice = invoice
    zap.loading = false

    await collectInvoice(invoice)

    // Listen for the zap confirmation
    sub = await listenForZapResponse(pubkey, lnurl, {
      relays: hints,
      onEvent: event => {
        zap.confirmed = true

        setTimeout(() => {
          if (!unmounted) {
            router.pop()
          }
        }, 1000)

        sub.close()
      },
    })
  }

  onDestroy(() => {
    unmounted = true
    sub?.close()
  })
</script>

<Content size="lg">
  <div class="text-center">
    <h1 class="staatliches text-2xl">Send a zap</h1>
    <p>to {displayPubkey(pubkey)}</p>
  </div>
  {#if zap.confirmed}
    <div class="flex items-center justify-center gap-2 text-lightest">
      <i class="fa fa-champagne-glasses" />
      <p>Success! Zap confirmed.</p>
    </div>
  {:else if zap.invoice}
    <QRCode code={zap.invoice} />
    <p class="text-center text-lightest">Copy or scan using a lightning wallet to pay your zap.</p>
    <div class="flex items-center justify-center gap-2 text-lightest">
      <i class="fa fa-circle-notch fa-spin" />
      Waiting for confirmation...
    </div>
  {:else}
    <Textarea bind:value={zap.message} placeholder="Add an optional message" />
    <Input bind:value={zap.amount}>
      <i slot="before" class="fa fa-bolt" />
      <span slot="after" class="-mt-1">sats</span>
    </Input>
    <Anchor button accent loading={zap.loading} on:click={loadZapInvoice}>Zap!</Anchor>
  {/if}
</Content>
