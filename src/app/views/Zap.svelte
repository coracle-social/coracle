<script lang="ts">
  import {init, launchPaymentModal, onModalClosed} from "@getalby/bitcoin-connect"
  import {sum, nth} from "@welshman/lib"
  import {makeZapRequest, requestZap, getZapResponseFilter} from "@welshman/util"
  import {Router, addMaximalFallbacks, addMinimalFallbacks} from "@welshman/router"
  import {Nip01Signer} from "@welshman/signer"
  import {signer, displayProfileByPubkey, loadZapper, loadProfile} from "@welshman/app"
  import Link from "src/partials/Link.svelte"
  import Button from "src/partials/Button.svelte"
  import FieldInline from "src/partials/FieldInline.svelte"
  import Toggle from "src/partials/Toggle.svelte"
  import Input from "src/partials/Input.svelte"
  import Textarea from "src/partials/Textarea.svelte"
  import PersonCircles from "src/app/shared/PersonCircles.svelte"
  import {router} from "src/app/util/router"
  import {env, myLoad, getSetting} from "src/engine"

  export let splits
  export let eventId = null
  export let anonymous = false
  export let amount = getSetting<number>("default_zap")

  let zapping = false
  let message = ""

  const platformRelay = Router.get()
    .FromPubkeys([env.PLATFORM_PUBKEY])
    .policy(addMinimalFallbacks)
    .getUrl()

  const startZapping = async () => {
    const totalWeight = sum(splits.map(s => parseFloat(s[3]) || 0))
    const percent = getSetting("platform_zap_split") as number
    const platformSplit = ["zap", env.PLATFORM_PUBKEY, platformRelay, percent * totalWeight]

    zapping = true

    for (const [_, pubkey, relay, weightString] of [...splits, platformSplit]) {
      const weight = parseFloat(weightString)
      const msats = 1000 * amount * (weight / totalWeight)

      if (!weight || pubkey.length !== 64) continue

      const profile = await loadProfile(pubkey)

      if (!profile?.lnurl) continue

      const zapper = await loadZapper(profile.lnurl)

      if (!zapper?.allowsNostr) continue

      const router = Router.get()
      const scenarios = [router.ForPubkey(pubkey), router.FromRelays([relay])]
      const relays = router.merge(scenarios).policy(addMaximalFallbacks).getUrls()
      const sig = anonymous ? Nip01Signer.ephemeral() : signer.get()
      const content = pubkey === env.PLATFORM_PUBKEY ? "" : message
      const params = {msats, zapper, pubkey, relays, content, eventId, anonymous}
      const event = await sig.sign(makeZapRequest(params))
      const {invoice, error} = await requestZap({zapper, event})

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

      myLoad({relays, filters: [getZapResponseFilter({zapper, pubkey, eventId})]})
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
    <Link modal href={router.at("people/list").qp({pubkeys}).toString()}>
      <PersonCircles class="h-5 w-5" {pubkeys} />
    </Link>
  </div>
{/if}
<Button class="btn btn-accent" on:click={startZapping} loading={zapping}>Zap!</Button>
