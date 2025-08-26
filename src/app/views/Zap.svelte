<script lang="ts">
  import {request} from "@welshman/net"
  import {nth, sum} from "@welshman/lib"
  import {Router, addMinimalFallbacks} from "@welshman/router"
  import {Nip01Signer} from "@welshman/signer"
  import {signer, loadZapperForPubkey, displayProfileByPubkey} from "@welshman/app"
  import {requestZap, makeZapRequest, getZapResponseFilter} from "@welshman/util"
  import {showInfo, showWarning} from "src/partials/Toast.svelte"
  import Link from "src/partials/Link.svelte"
  import Input from "src/partials/Input.svelte"
  import Button from "src/partials/Button.svelte"
  import FieldInline from "src/partials/FieldInline.svelte"
  import PersonLink from "src/app/shared/PersonLink.svelte"
  import PersonCircles from "src/app/shared/PersonCircles.svelte"
  import {router} from "src/app/util"
  import {env, getSetting, payInvoice} from "src/engine"

  export let splits
  export let id = undefined
  export let anonymous = false
  export let amount = getSetting<number>("default_zap")

  const minPos = 1
  const maxPos = 1000
  const minVal = 21
  const maxVal = 1000000

  const posToAmount = (pos: number) => {
    const normalizedPos = (pos - minPos) / (maxPos - minPos)
    const logMin = Math.log(minVal)
    const logMax = Math.log(maxVal)
    const logValue = logMin + normalizedPos * (logMax - logMin)
    return Math.round(Math.exp(logValue))
  }

  const amountToPos = (amount: number) => {
    const clampedAmount = Math.max(minVal, Math.min(maxVal, amount))
    const logMin = Math.log(minVal)
    const logMax = Math.log(maxVal)
    const logValue = Math.log(clampedAmount)
    const normalizedPos = (logValue - logMin) / (logMax - logMin)
    return Math.round(minPos + normalizedPos * (maxPos - minPos))
  }

  const back = () => router.pop()

  const platformRelay = Router.get()
    .FromPubkey(env.PLATFORM_PUBKEY)
    .policy(addMinimalFallbacks)
    .getUrl()

  const sendZap = async () => {
    const totalWeight = sum(splits.map(s => parseFloat(s[3]) || 0))
    const percent = getSetting("platform_zap_split") as number
    const platformSplit = ["zap", env.PLATFORM_PUBKEY, platformRelay, percent * totalWeight]

    loading = true

    let hasError = false

    try {
      const requests: Promise<unknown>[] = []

      for (const [_, pubkey, relay, weightString] of [...splits, platformSplit]) {
        const eventId = id
        const weight = parseFloat(weightString)
        const msats = 1000 * amount * (weight / totalWeight)
        const zapper = await loadZapperForPubkey(pubkey)

        if (!zapper) {
          return showWarning(`Failed to zap: no zapper found`)
        }

        const relays = [relay, ...Router.get().ForPubkey(pubkey).getUrls()]
        const filters = [getZapResponseFilter({zapper, pubkey, eventId})]
        const params = {pubkey, content, eventId, msats, relays, zapper}
        const sig = anonymous ? Nip01Signer.ephemeral() : signer.get()
        const event = await sig.sign(makeZapRequest(params))
        const res = await requestZap({zapper, event})

        if (!res.invoice) {
          if (pubkey === env.PLATFORM_PUBKEY) {
            continue
          } else {
            return showWarning(`Failed to zap: ${res.error || "no error given"}`)
          }
        }

        try {
          await payInvoice(res.invoice)

          const ctrl = new AbortController()

          requests.push(
            new Promise<void>(resolve =>
              request({
                filters,
                relays,
                signal: AbortSignal.any([AbortSignal.timeout(8000), ctrl.signal]),
                onEvent: () => ctrl.abort(),
                onClose: resolve,
              }),
            ),
          )
        } catch (e) {
          const message = String(e).replace(/^.*Error: /, "")

          showWarning(`Failed to zap ${displayProfileByPubkey(pubkey)}: ${message}`)
          hasError = true
        }
      }

      await Promise.all(requests)

      if (!hasError) {
        showInfo("Zap successfully sent!")
        back()
      }
    } finally {
      loading = false
    }
  }

  let content = ""
  let loading = false
  let pos = amountToPos(amount)

  const onPosChange = () => {
    amount = posToAmount(pos)
  }

  const onAmountChange = () => {
    pos = amountToPos(amount)
  }
</script>

<div class="flex flex-col gap-6">
  <div>
    <h2 class="staatliches text-2xl">Send a Zap</h2>
    <p>To <PersonLink underline pubkey={splits[0][1]} /></p>
  </div>
  <FieldInline label="Message (optional)">
    <Input bind:value={content} />
  </FieldInline>
  <FieldInline label="Amount">
    <Input type="number" bind:value={amount} on:input={onAmountChange} />
  </FieldInline>
  <Input
    class="-mt-2"
    type="range"
    min={minPos}
    max={maxPos}
    bind:value={pos}
    on:input={onPosChange} />
  {#if splits.length > 1}
    {@const pubkeys = splits.map(nth(1))}
    <div class="flex items-center gap-1 text-sm">
      <p>This note has zap splits enabled. You'll be zapping {splits.length} people:</p>
      <Link modal href={router.at("people/list").qp({pubkeys}).toString()}>
        <PersonCircles class="h-5 w-5" {pubkeys} />
      </Link>
    </div>
  {/if}
  <div class="flex justify-between">
    <Button class="btn" on:click={back}>
      <i class="fa fa-chevron-left" />
      Go back
    </Button>
    <Button class="btn btn-accent" on:click={sendZap} {loading}>
      {#if !loading}
        <i class="fa fa-bolt" />
      {/if}
      Send Zap
    </Button>
  </div>
</div>
