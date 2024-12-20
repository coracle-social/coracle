<script lang="ts">
  import {init, launchPaymentModal, onModalClosed} from "@getalby/bitcoin-connect"
  import {ctx, now, sortBy, tryCatch, fetchJson} from "@welshman/lib"
  import {createEvent} from "@welshman/util"
  import {Nip01Signer} from "@welshman/signer"
  import {signer, profilesByPubkey, displayProfileByPubkey, zappersByLnurl} from "@welshman/app"
  import Anchor from "src/partials/Anchor.svelte"
  import FieldInline from "src/partials/FieldInline.svelte"
  import Toggle from "src/partials/Toggle.svelte"
  import Input from "src/partials/Input.svelte"
  import Textarea from "src/partials/Textarea.svelte"
  import {router} from "src/app/util/router"
  import {env, load, getSetting} from "src/engine"

  export let splits
  export let id = null
  export let anonymous = false
  export let amount = getSetting<number>("default_zap")

  let zaps = []
  let message = ""
  let loading = false

  const updateZaps = (message: string, amount: number) => {
    let totalWeight = 0
    const percent = getSetting("platform_zap_split") as number

    for (const split of splits) {
      // validate the split
      if (split.length < 4 || split[1].length !== 64 || !split[3].match(/\d+(\.\d+)?$/)) {
        continue
      }
      // format the split
      const [pubkey, relay, weight] = [split[1], split[2], parseFloat(split[3])]
      if (weight === 0) continue
      // make sure we do not zap the same pubkey twice
      if (zaps.some(z => z[0] === pubkey)) continue
      totalWeight += weight
      zaps.push({pubkey, relay, weight, status: "pending"})
      // add the tip zip
      if (percent > 0) {
        zaps.push({
          pubkey: env.PLATFORM_PUBKEY,
          relay: ctx.app.router.FromPubkeys([env.PLATFORM_PUBKEY]).getUrl(),
          weight: weight * percent,
          status: "pending",
          isTip: true,
        })
      }
    }

    for (const zap of zaps) {
      zap.content = zap.isTip ? "" : message
      zap.amount = Math.round(amount * (zap.weight / totalWeight))
      zap.zapper = $zappersByLnurl.get($profilesByPubkey.get(zap.pubkey)?.lnurl)
      zap.relays = ctx.app.router
        .merge([ctx.app.router.ForPubkey(zap.pubkey), ctx.app.router.FromRelays([zap.relay])])
        .getUrls()
    }

    zaps = sortBy(
      z => -z.amount,
      zaps.filter(zip => zip.zapper?.allowsNostr),
    )
  }

  const requestZaps = () =>
    Promise.all(
      zaps.map(async (zap: any) => {
        const {amount, zapper, relays, content, pubkey} = zap
        const msats = amount * 1000
        const tags = [
          ["relays", ...relays],
          ["amount", msats.toString()],
          ["lnurl", zapper.lnurl],
          ["p", pubkey],
        ]

        if (id) {
          tags.push(["e", id])
        }

        if (anonymous) {
          tags.push(["anon"])
        }

        const $signer = anonymous ? Nip01Signer.ephemeral() : signer.get()
        const event = await $signer.sign(createEvent(9734, {content, tags}))
        const zapString = encodeURI(JSON.stringify(event))
        const qs = `?amount=${msats}&nostr=${zapString}&lnurl=${zapper.lnurl}`
        const res = await tryCatch(() => fetchJson(zapper.callback + qs))

        return {...zap, invoice: res?.pr, error: res?.reason}
      }),
    )

  const confirmZap = async () => {
    // Show loading immediately
    loading = true

    const since = now() - 30
    const preppedZaps = await requestZaps()

    // Close the router once we can show the next modal
    router.pop()

    for (const {invoice, error, relays, zapper, pubkey} of preppedZaps) {
      if (!invoice) {
        const profileDisplay = displayProfileByPubkey(pubkey)
        const message = error || "no error given"

        alert(`Failed to get an invoice for ${profileDisplay}: ${message}`)

        continue
      }

      launchPaymentModal({invoice})

      await new Promise<void>(resolve => {
        const unsub = onModalClosed(() => {
          resolve()
          unsub()
        })
      })

      load({
        relays,
        filters: [{kinds: [9735], authors: [zapper.nostrPubkey], "#p": [pubkey], since}],
      })
    }
  }

  // Watch inputs and update zaps
  $: updateZaps(message, amount)

  // Initialize bitcoin connect
  init({appName: import.meta.env.VITE_APP_NAME})
</script>

{#if zaps.length > 0}
  <h1 class="staatliches text-2xl">Send a zap</h1>
  <Textarea bind:value={message} placeholder="Send a message with your zap (optional)" />
  <Input bind:value={amount}>
    <i slot="before" class="fa fa-bolt" />
    <span slot="after" class="-mt-1">sats</span>
  </Input>
  <FieldInline>
    <div slot="label" class="flex items-center justify-between">
      <div class="flex items-center gap-2">
        <i class="fa fa-eye-slash" /> Zap anonymously
      </div>
      <Toggle bind:value={anonymous} />
    </div>
  </FieldInline>
  <Anchor button accent {loading} on:click={confirmZap}>Zap!</Anchor>
{/if}
