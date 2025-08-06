<script lang="ts">
  import {nwc} from "@getalby/sdk"
  import {LOCALE} from "@welshman/lib"
  import {displayRelayUrl, fromMsats} from "@welshman/util"
  import {session} from "@welshman/app"
  import Icon from "src/partials/Icon.svelte"
  import Link from "src/partials/Link.svelte"
  import {getWebLn} from "src/engine"
  import {router} from "src/app/util"
</script>

<div class="flex flex-col gap-6">
  <div class="flex justify-between">
    <div class="flex items-center gap-2">
      <i class="fa fa-server fa-lg" />
      <h2 class="staatliches text-2xl">Your Wallet</h2>
    </div>
    {#if $session?.wallet}
      <div class="flex items-center gap-2 text-sm text-success">
        <i class="fa fa-check" />
        Connected
      </div>
    {:else}
      <Link modal class="btn btn-accent" href={router.at("settings/wallet/connect").toString()}>
        Connect Wallet
      </Link>
    {/if}
  </div>
  <div class="flex flex-col gap-4">
    {#if $session?.wallet}
      {#if $session.wallet?.type === "webln"}
        {@const {node, version} = $session.wallet.info}
        <div class="flex flex-col justify-between gap-2 lg:flex-row">
          <p>
            Connected to <strong>{node?.alias || version || "unknown wallet"}</strong>
            via <strong>{$session.wallet.type}</strong>
          </p>
          <p class="flex gap-2 whitespace-nowrap">
            Balance:
            {#await getWebLn()
              ?.enable()
              .then(() => getWebLn().getBalance())}
              <span class="loading loading-spinner loading-sm"></span>
            {:then res}
              {new Intl.NumberFormat(LOCALE).format(res?.balance || 0)}
            {:catch}
              [unknown]
            {/await}
            sats
          </p>
        </div>
      {:else if $session.wallet.type === "nwc"}
        {@const {lud16, relayUrl, nostrWalletConnectUrl} = $session.wallet.info}
        <div class="flex flex-col justify-between gap-2 lg:flex-row">
          <p>
            Connected to <strong>{lud16}</strong> via <strong>{displayRelayUrl(relayUrl)}</strong>
          </p>
          <p class="flex gap-2 whitespace-nowrap">
            Balance:
            {#await new nwc.NWCClient({nostrWalletConnectUrl}).getBalance()}
              <span class="loading loading-spinner loading-sm"></span>
            {:then res}
              {new Intl.NumberFormat(LOCALE).format(fromMsats(res?.balance || 0))}
            {:catch}
              [unknown]
            {/await}
            sats
          </p>
        </div>
      {/if}
      <Link modal class="btn" href={router.at("settings/wallet/disconnect").toString()}>
        <Icon icon="close-circle" />
        Disconnect Wallet
      </Link>
    {:else}
      <p class="py-12 text-center opacity-75">No wallet connected</p>
    {/if}
  </div>
</div>
