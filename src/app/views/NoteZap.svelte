<script lang="ts">
  import {onDestroy} from "svelte"
  import {warn} from "src/util/logger"
  import {fetchJson, now} from "src/util/misc"
  import {modal} from "src/partials/state"
  import QRCode from "src/partials/QRCode.svelte"
  import Content from "src/partials/Content.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Input from "src/partials/Input.svelte"
  import Textarea from "src/partials/Textarea.svelte"
  import {directory, routing} from "src/system"
  import network from "src/agent/network"
  import {keys, cmd, settings, nip57} from "src/system"

  export let note

  let sub
  let zap = {
    amount: settings.getSetting("defaultZap"),
    message: "",
    invoice: null,
    loading: false,
    startedAt: now(),
    confirmed: false,
  }

  const author = directory.getProfile(note.pubkey)

  const loadZapInvoice = async () => {
    zap.loading = true

    const amount = zap.amount * 1000
    const zapper = nip57.zappers.get(note.pubkey)
    const relays = routing.getPublishHints(3, note)
    const publishable = cmd.requestZap(
      relays,
      zap.message,
      note.pubkey,
      note.id,
      amount,
      zapper.lnurl
    )
    const event = encodeURI(JSON.stringify(await keys.sign(publishable.event)))
    const res = await fetchJson(
      `${zapper.callback}?amount=${amount}&nostr=${event}&lnurl=${zapper.lnurl}`
    )

    // If they closed the dialog before fetch resolved, we're done
    if (!zap) {
      return
    }

    if (!res.pr) {
      throw new Error(JSON.stringify(res))
    }

    zap.invoice = res.pr
    zap.loading = false

    // Open up alby or whatever
    const {webln} = window as {webln?: any}
    if (webln) {
      await webln.enable()

      try {
        webln.sendPayment(zap.invoice)
      } catch (e) {
        warn(e)
      }
    }

    // Listen for the zap confirmation
    sub = network.listen({
      relays,
      filter: {
        kinds: [9735],
        authors: [zapper.nostrPubkey],
        "#p": [note.pubkey],
        since: zap.startedAt - 10,
      },
      onChunk: chunk => {
        zap.confirmed = true
        setTimeout(() => modal.pop(), 1000)
      },
    })
  }

  onDestroy(() => {
    sub?.then(s => s.unsub())
  })
</script>

<Content size="lg">
  <div class="text-center">
    <h1 class="staatliches text-2xl">Send a zap</h1>
    <p>to {directory.displayProfile(author)}</p>
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
