<script lang="ts">
  import {init, launchPaymentModal, onModalClosed} from "@getalby/bitcoin-connect"
  import {sortBy, uniqBy, filter, map, reject} from "ramda"
  import {doPipe, Fetch} from "hurdak"
  import {now, tryCatch} from "@welshman/lib"
  import {createEvent} from "@welshman/util"
  import {generatePrivateKey} from "src/util/nostr"
  import Anchor from "src/partials/Anchor.svelte"
  import FieldInline from "src/partials/FieldInline.svelte"
  import Toggle from "src/partials/Toggle.svelte"
  import Input from "src/partials/Input.svelte"
  import Textarea from "src/partials/Textarea.svelte"
  import {router} from "src/app/util/router"
  import {env, load, hints, signer, getSetting, getZapper} from "src/engine"

  export let splits
  export let eid = null
  export let anonymous = false
  export let callback = null

  let message = ""
  let loading = false
  let totalWeight = 0
  let totalAmount = getSetting("default_zap")

  const zaps = doPipe(splits, [
    reject((s: string[]) => s.length < 4 || s[1].length !== 64 || !s[3].match(/\d+(\.\d+)?$/)),
    map((s: string[]) => [...s.slice(1, 3), parseFloat(s[3])]),
    filter((s: any[]) => s[2] && s[2] > 0),
    uniqBy((s: any[]) => s[0]),
    map((s: any[]) => {
      totalWeight += s[2]

      return s
    }),
    map(([pubkey, relay, weight]: string[]) => ({
      relay,
      pubkey,
      amount: Math.round(totalAmount * (parseFloat(weight) / totalWeight)),
      status: "pending",
    })),
    sortBy((split: any) => -split.amount),
    (zaps: any[]) => {
      const percent = getSetting("platform_zap_split")

      // Add our platform split on top as a "tip"
      if (percent > 0 && totalWeight > 0) {
        zaps.push({
          pubkey: $env.PLATFORM_PUBKEY,
          relay: hints.FromPubkeys([$env.PLATFORM_PUBKEY]).getUrl(),
          amount: Math.round(zaps.reduce((a, z) => a + z.amount, 0) * percent),
          status: "pending",
          isTip: true,
        })
      }

      // Add our zapper and relay hints
      return zaps.map((zap, i) => {
        const content = i === 0 ? message : ""
        const zapper = getZapper(zap.pubkey)
        const relays = hints
          .merge([hints.PublishMessage(zap.pubkey), hints.fromRelays([zap.relay])])
          .getUrls()

        return {...zap, zapper, relays, content}
      })
    },
    filter((zap: any) => zap.zapper?.lnurl),
    // Request our invoice
    map(async (zap: any) => {
      const {amount, zapper, relays, content, pubkey} = zap
      const msats = amount * 1000
      const tags = [
        ["relays", ...relays],
        ["amount", msats.toString()],
        ["lnurl", zapper.lnurl],
        ["p", pubkey],
      ]

      if (eid) {
        tags.push(["e", eid])
      }

      if (anonymous) {
        tags.push(["anon"])
      }

      const template = createEvent(9734, {content, tags})
      const signedTemplate = anonymous
        ? await signer.get().signWithKey(template, generatePrivateKey())
        : await signer.get().signAsUser(template)
      const zapString = encodeURI(JSON.stringify(signedTemplate))
      const qs = `?amount=${msats}&nostr=${zapString}&lnurl=${zapper.lnurl}`
      const res = await tryCatch(() => Fetch.fetchJson(zapper.callback + qs))

      return {...zap, invoice: res?.pr}
    }),
  ])

  const confirmZap = async () => {
    // Show loading immediately
    loading = true

    const since = now() - 30
    const preppedZaps = await Promise.all(zaps)

    // Close the router once we can show the next modal
    router.pop()

    for (const {invoice, relays, zapper, pubkey} of preppedZaps) {
      if (!invoice) {
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
        onEvent: callback,
        filters: [{kinds: [9735], authors: [zapper.nostrPubkey], "#p": [pubkey], since}],
      })
    }
  }

  // Initialize bitcoin connect
  init({appName: import.meta.env.VITE_APP_NAME})
</script>

{#if zaps.length > 0}
  <h1 class="staatliches text-2xl">Send a zap</h1>
  <Textarea bind:value={message} placeholder="Send a message with your zap (optional)" />
  <Input bind:value={totalAmount}>
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
