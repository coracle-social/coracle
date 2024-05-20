<script lang="ts">
  import QRCode from "src/partials/QRCode.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Input from "src/partials/Input.svelte"
  import {collectInvoice, displayPubkey} from "src/engine"

  export let zap

  let attemptingToPay = false

  const collect = async () => {
    attemptingToPay = true

    await collectInvoice(zap.invoice)
  }
</script>

<div class="flex flex-col gap-2">
  {#if zap.invoice}
    <div class="flex items-center justify-center gap-2">
      {#if zap.status === "pending"}
        <i class="fa fa-circle-notch fa-spin" />
        {#if zap.isTip}
          Tipping
        {:else}
          Paying
        {/if}
      {:else if zap.status === "success"}
        <i class="fa fa-check text-success" /> Paid
      {/if}
      {zap.amount} sats to {displayPubkey(zap.pubkey)}
    </div>
    <QRCode code={zap.invoice} onClick={collect}>
      <div slot="below" let:copy class="flex gap-1">
        <Input value={zap.invoice} class="flex-grow">
          <button slot="after" class="fa fa-copy" on:click={copy} />
        </Input>
        {#if zap.status === "pending"}
          <Anchor button accent on:click={collect} disabled={attemptingToPay} class="w-24">
            {#if attemptingToPay}
              <i class="fa fa-circle-notch fa-spin" />
            {:else}
              Pay
            {/if}
          </Anchor>
        {:else}
          <Anchor button accent disabled>Paid!</Anchor>
        {/if}
      </div>
    </QRCode>
  {:else if zap.status === "error:zapper"}
    <div class="flex aspect-square items-center justify-center">
      <p>Failed to find a zap provider for {displayPubkey(zap.pubkey)}.</p>
    </div>
  {:else}
    <div class="flex aspect-square items-center justify-center">
      <Spinner />
    </div>
  {/if}
</div>
