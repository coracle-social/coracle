<script lang="ts">
  import {getRelayQuality, relaysByUrl} from "@welshman/app"
  import {ctx} from "@welshman/lib"
  import {AuthStatus, SocketStatus, type Connection} from "@welshman/net"
  import {displayRelayUrl} from "@welshman/util"
  import {quantify} from "hurdak"
  import {onMount} from "svelte"
  import AltColor from "src/partials/AltColor.svelte"
  import SelectButton from "src/partials/SelectButton.svelte"

  export let selected: string
  export let activeTab: string

  const connectionsStatus: {[key: string]: Map<string, Connection>} = {}

  const options = [
    "Connected",
    "Logging in",
    "Failed to log in",
    "Failed to connect",
    "Waiting to reconnect",
    "Not connected",
    "Unstable connection",
  ]

  const pendingStatuses = [
    AuthStatus.Requested,
    AuthStatus.PendingSignature,
    AuthStatus.PendingResponse,
  ]

  const failureStatuses = [AuthStatus.DeniedSignature, AuthStatus.Forbidden]

  $: connections = Array.from(ctx.net.pool.data.entries())
    .filter(([url, cxn]) => (selected ? connectionsStatus[selected]?.has(url) : true))
    .map(([url, cxn]) => cxn)

  onMount(() => {
    const interval = setInterval(() => {
      for (const [url, cxn] of ctx.net.pool.data.entries()) {
        if (pendingStatuses.includes(cxn.auth.status)) {
          connectionsStatus["Logging in"] = (connectionsStatus["Logging in"] || new Map()).set(
            url,
            cxn,
          )
        } else if (failureStatuses.includes(cxn.auth.status)) {
          connectionsStatus["Failed to log in"] = (
            connectionsStatus["Failed to log in"] || new Map()
          ).set(url, cxn)
        } else if (cxn.socket.status === SocketStatus.Error) {
          connectionsStatus["Failed to connect"] = (
            connectionsStatus["Failed to connect"] || new Map()
          ).set(url, cxn)
        } else if (cxn.socket.status === SocketStatus.Closed) {
          connectionsStatus["Waiting to reconnect"] = (
            connectionsStatus["Waiting to reconnect"] || new Map()
          ).set(url, cxn)
        } else if (cxn.socket.status === SocketStatus.New) {
          connectionsStatus["Not connected"] = (
            connectionsStatus["Not connected"] || new Map()
          ).set(url, cxn)
        } else if (getRelayQuality(cxn.url) < 0.5) {
          connectionsStatus["Unstable connection"] = (
            connectionsStatus["Unstable connection"] || new Map()
          ).set(url, cxn)
        } else {
          connectionsStatus["Connected"] = (connectionsStatus["Connected"] || new Map()).set(
            url,
            cxn,
          )
        }
      }
    }, 800)

    return () => {
      clearInterval(interval)
    }
  })
</script>

<SelectButton {options} bind:value={selected}>
  <div slot="item" let:option let:active>
    <div class="flex items-center gap-2">
      {Array.from(connectionsStatus[option]?.values() || []).length || 0}
      {option}
    </div>
  </div>
</SelectButton>
{#each connections as cxn (cxn.url)}
  {@const relay = $relaysByUrl.get(cxn.url)}
  <AltColor
    background
    class="cursor-pointer justify-between rounded-md p-6 shadow"
    on:click={() => {
      selected = cxn.url
      activeTab = "notices"
    }}>
    <div class="flex min-w-0 shrink-0 items-start gap-3">
      {#if relay?.profile?.icon}
        <img class="h-9 w-9 shrink-0 rounded-full border" src={relay.profile.icon} />
      {:else}
        <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border">
          <i class="fa fa-server text-xl text-neutral-100"></i>
        </div>
      {/if}
      <div class="shrink-0">
        <div class="flex items-center gap-2">
          <div class="text-md overflow-hidden text-ellipsis whitespace-nowrap">
            {displayRelayUrl(cxn.url)}
          </div>
        </div>
        <div class="flex gap-4 text-xs text-neutral-400">
          {#if relay?.profile?.supported_nips}
            <span>
              {relay.profile.supported_nips.length} NIPs
            </span>
          {/if}
          <span>
            Connected {quantify(relay?.stats?.open_count || 0, "time")}
          </span>
        </div>
      </div>
      <div class="flex w-full items-center justify-end gap-2 text-sm">
        {#each options as opt}
          {#if connectionsStatus[opt]?.has(cxn.url)}
            <div class="hidden items-center gap-2 first:flex">
              <span>{opt}</span>
              <div
                class:!bg-danger={opt.includes("Failed") || opt.includes("Not")}
                class:!bg-warning={opt == "Logging in" ||
                  opt == "Waiting to reconnect" ||
                  opt == "Unstable connection"}
                class="h-3 w-3 rounded-full bg-success" />
            </div>
          {/if}
        {/each}
      </div>
    </div>
  </AltColor>
{/each}
