<script lang="ts">
  import {onDestroy} from "svelte"
  import {now} from "src/util/misc"
  import {modal} from "src/partials/state"
  import QRCode from "src/partials/QRCode.svelte"
  import Content from "src/partials/Content.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Input from "src/partials/Input.svelte"
  import Textarea from "src/partials/Textarea.svelte"
  import {getSetting} from "src/engine2"
  import {Directory, Nip65, user, Outbox, Network, Builder, Nip57} from "src/app/engine"

  export let pubkey
  export let note = null
  export let zapper = null
  export let author = null

  let sub
  let zap = {
    amount: getSetting("default_zap"),
    message: "",
    invoice: null,
    loading: false,
    startedAt: now(),
    confirmed: false,
  }

  const _zapper = zapper || Nip57.zappers.key(pubkey).get()
  const _author = author || Directory.getProfile(pubkey)

  const loadZapInvoice = async () => {
    zap.loading = true

    const amount = zap.amount * 1000
    const relayLimit = getSetting("relay_limit")
    const relays = note
      ? Nip65.getPublishHints(relayLimit, note, user.getRelayUrls("write"))
      : Nip65.getPubkeyHints(relayLimit, pubkey, "read")
    const rawEvent = Builder.requestZap(
      relays,
      zap.message,
      pubkey,
      note?.id,
      amount,
      _zapper.lnurl
    )
    const signedEvent = await Outbox.prep(rawEvent)
    const invoice = await Nip57.fetchInvoice(_zapper, signedEvent, amount)

    // If they closed the dialog before fetch resolved, we're done
    if (!zap) {
      return
    }

    zap.invoice = invoice
    zap.loading = false

    await Nip57.collectInvoice(invoice)

    // Listen for the zap confirmation
    sub = Network.subscribe({
      relays,
      filter: {
        kinds: [9735],
        authors: [_zapper.nostrPubkey],
        "#p": [pubkey],
        since: zap.startedAt - 10,
      },
      onEvent: event => {
        zap.confirmed = true
        setTimeout(() => modal.pop(), 1000)
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
    <p>to {Directory.displayProfile(_author)}</p>
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
