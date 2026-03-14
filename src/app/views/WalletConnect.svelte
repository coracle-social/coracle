<script lang="ts">
  import {_} from "svelte-i18n"
  import {get} from "svelte/store"
  import {debounce} from "throttle-debounce"
  import {nwc} from "@getalby/sdk"
  import {assoc, sleep} from "@welshman/lib"
  import type {NWCInfo} from "@welshman/util"
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

  export let qp

  const back = () => router.clearModals()

  const next = () => router.at("zap").qp(qp).replaceModal()

  const t = () => get(_)

  const connectWithWebLn = async () => {
    loading = true

    try {
      await Promise.all([sleep(800), getWebLn().enable()])
      const info = await getWebLn().getInfo()

      if (!info?.supports?.includes("lightning")) {
        showWarning(t()("walletConnect.extensionNoSupport"))
      } else {
        updateSession($pubkey, assoc("wallet", {type: "webln", info}))
        showInfo(t()("walletConnect.walletConnected"))

        await sleep(400)

        if (next) {
          next()
        } else {
          back()
        }
      }
    } catch (e) {
      console.error(e)
      showWarning(t()("walletConnect.walletFailed"))
    } finally {
      loading = false
    }
  }

  const connectWithNWC = async () => {
    loading = true

    try {
      const client = new nwc.NWCClient({nostrWalletConnectUrl})
      const [_d, info] = await Promise.all([sleep(800), client.getInfo()])

      if (!info) {
        showWarning(t()("walletConnect.walletFailed"))
      } else {
        updateSession(
          $pubkey,
          assoc("wallet", {type: "nwc", info: client.options as unknown as NWCInfo}),
        )
        showInfo(t()("walletConnect.walletConnected"))

        await sleep(400)

        if (next) {
          next()
        } else {
          back()
        }
      }
    } catch (e) {
      console.error(e)
      showWarning(t()("walletConnect.walletFailed"))
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
    <h2 class="staatliches text-2xl">{$_("walletConnect.title")}</h2>
    <p>{$_("walletConnect.description")}</p>
  </div>
  <div>
    {#if getWebLn()}
      <div class="flex flex-col gap-2">
        <Button
          class="btn btn-accent w-full"
          loading={loading && !nostrWalletConnectUrl}
          disabled={Boolean(nostrWalletConnectUrl)}
          on:click={connectWithWebLn}>
          {#if loading && !nostrWalletConnectUrl}
            {$_("walletConnect.connecting")}
          {:else}
            <i class="fa fa-puzzle-piece fa-sm" />
            {$_("walletConnect.connectWithWebLN")}
          {/if}
        </Button>
        {#if qp}
          <Button
            class="btn btn-low w-full"
            disabled={Boolean(nostrWalletConnectUrl)}
            on:click={next}>
            <i class="fa fa-qrcode fa-sm" />
            {$_("walletConnect.payManually")}
          </Button>
        {/if}
        <Divider>{$_("walletConnect.or")}</Divider>
      </div>
    {/if}
    <Field label={$_("walletConnect.connectionSecret")}>
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
        {$_("walletConnect.connectionSecretInfo")}
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
      {$_("walletConnect.goBack")}
    </Button>
    <Button
      class="btn btn-accent"
      disabled={!nostrWalletConnectUrl}
      loading={Boolean(loading && nostrWalletConnectUrl)}
      on:click={connectWithNWC}>
      {#if loading && nostrWalletConnectUrl}
        {$_("walletConnect.connecting")}
      {:else}
        {$_("wallet.connectWallet")}
        <i class="fa fa-chevron-right" />
      {/if}
    </Button>
  </div>
</div>
