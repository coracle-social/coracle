<script lang="ts">
  import {init, launchPaymentModal, onModalClosed} from "@getalby/bitcoin-connect"
  import {ctx, sum, nth, now, tryCatch, fetchJson} from "@welshman/lib"
  import {createEvent, ZAP_REQUEST} from "@welshman/util"
  import {Nip01Signer} from "@welshman/signer"
  import {signer, displayProfileByPubkey, loadZapper, loadProfile} from "@welshman/app"
  import Anchor from "src/partials/Anchor.svelte"
  import FieldInline from "src/partials/FieldInline.svelte"
  import Toggle from "src/partials/Toggle.svelte"
  import Input from "src/partials/Input.svelte"
  import Textarea from "src/partials/Textarea.svelte"
  import PersonCircles from "src/app/shared/PersonCircles.svelte"
  import {router} from "src/app/util/router"
  import {env, load, getSetting} from "src/engine"

  export let splits
  export let id = null
  export let anonymous = false
  export let amount = getSetting<number>("default_zap")

  let message = ""

  const platformRelay = ctx.app.router.FromPubkeys([env.PLATFORM_PUBKEY]).getUrl()

  const requestZap = async ({pubkey, relay, msats, zapper, relays}) => {
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

    const sig = anonymous ? Nip01Signer.ephemeral() : signer.get()
    const content = pubkey === env.PLATFORM_PUBKEY ? "" : message
    const event = await sig.sign(createEvent(ZAP_REQUEST, {content, tags}))
    const zapString = encodeURI(JSON.stringify(event))
    const qs = `?amount=${msats}&nostr=${zapString}&lnurl=${zapper.lnurl}`
    const res = await tryCatch(() => fetchJson(zapper.callback + qs))

    return {invoice: res?.pr, error: res?.reason}
  }

  const sendZap = async ({pubkey, relays, zapper}, {invoice, error}) => {
    if (!invoice) {
      const profileDisplay = displayProfileByPubkey(pubkey)
      const message = error || "no error given"

      return alert(`Failed to get an invoice for ${profileDisplay}: ${message}`)
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
      filters: [{kinds: [9735], authors: [zapper.nostrPubkey], "#p": [pubkey], since: now() - 30}],
    })
  }

  const startZapping = async () => {
    const totalWeight = sum(splits.map(s => parseFloat(s[3]) || 0))
    const percent = getSetting("platform_zap_split") as number
    const platformSplit = ["zap", env.PLATFORM_PUBKEY, platformRelay, percent * totalWeight]

    for (const [_, pubkey, relay, weightString] of [...splits, platformSplit]) {
      const weight = parseFloat(weightString)
      const msats = 1000 * amount * (weight / totalWeight)

      if (!weight || pubkey.length !== 64) continue

      const profile = await loadProfile(pubkey)

      if (!profile?.lnurl) continue

      const zapper = await loadZapper(profile.lnurl)

      if (!zapper?.allowsNostr) continue

      const relays = ctx.app.router
        .merge([ctx.app.router.ForPubkey(pubkey), ctx.app.router.FromRelays([relay])])
        .getUrls()

      const zap = {pubkey, relay, msats, zapper, relays}

      await sendZap(zap, await requestZap(zap))
    }

    router.pop()
  }

  // Initialize bitcoin connect
  init({appName: import.meta.env.VITE_APP_NAME})
</script>

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
{#if splits.length > 1}
  {@const pubkeys = splits.map(nth(1))}
  <div class="flex items-center gap-1 text-sm">
    <p>This note has zap splits enabled. You'll be zapping {splits.length} people:</p>
    <Anchor modal href={router.at("people/list").qp({pubkeys}).toString()}>
      <PersonCircles class="h-5 w-5" {pubkeys} />
    </Anchor>
  </div>
{/if}
<Anchor button accent on:click={startZapping}>Zap!</Anchor>
