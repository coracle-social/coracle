<script lang="ts">
  import {debounce} from "throttle-debounce"
  import {nwc} from "@getalby/sdk"
  import {assoc, sleep} from "@welshman/lib"
  import type {NWCInfo} from "@welshman/app"
  import {pubkey, updateSession} from "@welshman/app"
  import Link from "src/partials/Link.svelte"
  import Input from "src/partials/Input.svelte"
  import Button from "src/partials/Button.svelte"
  import Scanner from "src/partials/Scanner.svelte"
  import Field from "src/partials/Field.svelte"
  import Divider from "src/partials/Divider.svelte"
  import {showInfo, showWarning} from "src/partials/Toast.svelte"
  import {getWebLn} from "src/engine"
  import {router} from "src/app/util"

  export let next

  const back = () => router.clearModals()

  const connectWithWebLn = async () => {
    loading = true

    try {
      await Promise.all([sleep(800), getWebLn().enable()])
      const info = await getWebLn().getInfo()

      if (!info?.supports?.includes("lightning")) {
        showWarning("Your extension does not support lightning payments")
      } else {
        updateSession($pubkey, assoc("wallet", {type: "webln", info}))
        showInfo("Wallet successfully connected!")

        await sleep(400)

        next ? next() : back()
      }
    } catch (e) {
      console.error(e)
      showWarning("Wallet failed to connect")
    } finally {
      loading = false
    }
  }

  const connectWithNWC = async () => {
    loading = true

    try {
      const client = new nwc.NWCClient({nostrWalletConnectUrl})
      const [_, info] = await Promise.all([sleep(800), client.getInfo()])

      if (!info) {
        showWarning("Wallet failed to connect")
      } else {
        updateSession(
          $pubkey,
          assoc("wallet", {type: "nwc", info: client.options as unknown as NWCInfo}),
        )
        showInfo("Wallet successfully connected!")

        await sleep(400)

        next ? next() : back()
      }
    } catch (e) {
      console.error(e)
      showWarning("Wallet failed to connect")
    } finally {
      loading = false
    }
  }

  const toggleScanner = () => {
    showScanner = !showScanner
  }

  const onScan = debounce(1000, async (data: string) => {
    showScanner = false
    nostrWalletConnectUrl = data
    await connectWithNWC()
  })

  let nostrWalletConnectUrl = ""
  let showScanner = false
  let loading = false
</script>

<div class="flex flex-col gap-6">
  <div>
    <h2 class="staatliches text-2xl">Connect a Wallet</h2>
    <p>Use Nostr Wallet Connect to send Bitcoin payments over Lightning.</p>
  </div>
  <div>
    {#if getWebLn()}
      <Button
        class="btn btn-accent w-full"
        loading={loading && !nostrWalletConnectUrl}
        disabled={Boolean(nostrWalletConnectUrl)}
        on:click={connectWithWebLn}>
        {#if loading && !nostrWalletConnectUrl}
          Connecting...
        {:else}
          <i class="fa fa-puzzle-piece fa-sm" />
          Connect with WebLN
        {/if}
      </Button>
      <Divider>Or</Divider>
    {/if}
    <Field label="Connection Secret">
      <Input
        type="password"
        autocomplete="off"
        name="flotilla-nwc"
        bind:value={nostrWalletConnectUrl}>
        <i slot="before" class="fa fa-lock" />
        <button type="button" slot="after" on:click={toggleScanner}>
          <i class="fa fa-qrcode" />
        </button>
      </Input>
      <span slot="info">
        You can find this in any wallet that supports
        <Link external href="https://nwc.getalby.com/about" class="text-primary"
          >Nostr Wallet Connect</Link
        >.
      </span>
    </Field>
  </div>
  {#if showScanner}
    <Scanner onscan={onScan} />
  {/if}
  <div class="flex justify-between">
    <Button class="btn btn-link" on:click={back}>
      <i class="fa fa-chevron-left" />
      Go back
    </Button>
    <Button
      class="btn btn-accent"
      disabled={!nostrWalletConnectUrl}
      loading={Boolean(loading && nostrWalletConnectUrl)}
      on:click={connectWithNWC}>
      {#if loading && nostrWalletConnectUrl}
        Connecting...
      {:else}
        Connect Wallet
        <i class="fa fa-chevron-right" />
      {/if}
    </Button>
  </div>
</div>
