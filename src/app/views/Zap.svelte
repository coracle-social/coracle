<script context="module" lang="ts">
  type Zap = {
    relay: string
    pubkey: string
    amount: number
    status: string
    invoice?: string
  }
</script>

<script lang="ts">
  import {sortBy, uniqBy, whereEq, filter, map, reject} from "ramda"
  import {doPipe} from "hurdak"
  import {onDestroy} from "svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import FieldInline from "src/partials/FieldInline.svelte"
  import Toggle from "src/partials/Toggle.svelte"
  import Input from "src/partials/Input.svelte"
  import Textarea from "src/partials/Textarea.svelte"
  import ZapInvoice from "src/app/shared/ZapInvoice.svelte"
  import {router} from "src/app/router"
  import {
    env,
    getSetting,
    derivePerson,
    requestZap,
    listenForZapResponse,
    mergeHints,
    getPubkeyHint,
    getPubkeyHints,
    selectHintsWithFallback,
  } from "src/engine"

  export let splits
  export let eid = null
  export let anonymous = false
  export let callback = null

  const subs = []

  let closing = false
  let stage = "message"
  let message = ""
  let zaps: Zap[] = []
  let totalWeight = 0
  let totalAmount = getSetting("default_zap")

  $: {
    totalWeight = 0
    zaps = doPipe<Zap[]>(splits, [
      reject((s: string[]) => s.length < 4 || s[1].length !== 64 || !s[3].match(/\d+(\.\d+)?$/)),
      map((s: string[]) => [...s.slice(1, 3), parseFloat(s[3])]),
      filter((s: any[]) => s[2] && s[2] > 0),
      uniqBy((s: any[]) => s[0]),
      map((s: any[]) => {
        totalWeight += s[2]

        return s
      }),
      (ss: any[][]) => {
        const percent = getSetting("platform_zap_split")

        // Avoid divide by zero errors
        if (totalWeight === 0) {
          totalWeight = 1
        }

        // Add our platform split
        if (percent > 0) {
          ss.push([
            $env.PLATFORM_PUBKEY,
            getPubkeyHint($env.PLATFORM_PUBKEY),
            String(totalWeight * percent),
          ])
        }

        return ss
      },
      map(([pubkey, relay, weight]: string[]) => ({
        relay,
        pubkey,
        amount: Math.round(totalAmount * (parseFloat(weight) / totalWeight)),
        status: "pending",
        invoice: null,
      })),
      sortBy((split: Zap) => -split.amount),
    ])
  }

  const next = async () => {
    stage = "invoice"

    zaps.forEach(async (zap, i) => {
      const msg = i === 0 ? message : ""
      const {zapper} = derivePerson(zap.pubkey).get()

      if (!zapper?.lnurl) {
        zaps[i].status = "error:zapper"
        return
      }

      const relays = selectHintsWithFallback(
        mergeHints([[zap.relay], getPubkeyHints(zap.pubkey, "read")]),
      )

      zaps[i].invoice = await requestZap(msg, zap.amount, {
        eid,
        relays,
        anonymous,
        lnurl: zapper.lnurl,
        pubkey: zap.pubkey,
      })

      const sub = await listenForZapResponse(zap.pubkey, zapper.lnurl, {
        relays,
        onEvent: event => {
          zaps[i].status = "success"
          callback?.(event)
          sub.close()
        },
      })

      subs.push(sub)
    })
  }

  const prev = () => {
    zaps = zaps.map(zap => ({...zap, invoice: null, status: "pending"}))
    stage = "message"
  }

  const done = () => {
    router.pop()
  }

  $: {
    if (!closing && zaps.length > 0 && zaps.every(whereEq({status: "success"}))) {
      closing = true
      done()
    }
  }

  onDestroy(() => {
    for (const sub of subs) {
      sub.close()
    }
  })
</script>

{#if zaps.length > 0}
  {#if stage === "message"}
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
    <Anchor button accent on:click={next}>Zap!</Anchor>
  {:else}
    {@const partitionAt = Math.ceil(zaps.length * 0.3)}
    <div class="grid gap-8" class:sm:grid-cols-5={zaps.length > 1}>
      <div class="flex flex-col gap-8" class:sm:col-span-3={zaps.length > 1}>
        {#each zaps.slice(0, partitionAt) as zap (zap.pubkey)}
          <ZapInvoice {zap} />
        {/each}
      </div>
      <div class="flex flex-col gap-8" class:sm:col-span-2={zaps.length > 1}>
        {#each zaps.slice(partitionAt) as zap (zap.pubkey)}
          <ZapInvoice {zap} />
        {/each}
      </div>
    </div>
    <div class="flex gap-2">
      <Anchor button on:click={prev}><i class="fa fa-arrow-left" /> Back</Anchor>
      <Anchor button accent class="flex-grow" on:click={done}>Done zapping</Anchor>
    </div>
  {/if}
{/if}
