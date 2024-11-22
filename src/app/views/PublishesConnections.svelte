<script lang="ts">
  import {getRelayQuality, relaysByUrl, thunks} from "@welshman/app"
  import {AuthStatus, PublishStatus, SocketStatus, type Connection} from "@welshman/net"
  import {ctx} from "@welshman/lib"
  import {displayRelayUrl} from "@welshman/util"
  import {onMount} from "svelte"
  import cx from "classnames"
  import AltColor from "src/partials/AltColor.svelte"
  import {quantify} from "hurdak"
  import {get} from "svelte/store"
  import Tile from "src/partials/Tile.svelte"

  export let selected: string
  export let activeTab: string

  const connectionsStatus: {[key: string]: Map<string, Connection>} = {}
  const filters: {[key: string]: boolean} = {}

  const pendingStatuses = [
    AuthStatus.Requested,
    AuthStatus.PendingSignature,
    AuthStatus.PendingResponse,
  ]

  const failureStatuses = [AuthStatus.DeniedSignature, AuthStatus.Forbidden]

  function getStatus(status: PublishStatus, cxn: Connection) {
    return Object.values($thunks).filter(t => get(t.status)[cxn.url]?.status == status)
  }

  $: connections = Array.from(ctx.net.pool.data.entries())
    .filter(([url, cxn]) =>
      Object.keys(filters).filter(f => filters[f]).length
        ? Object.keys(filters).some(f => filters[f] && connectionsStatus[f]?.has(url))
        : true,
    )
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

<div class="grid grid-cols-6 justify-between gap-2 sm:grid-cols-4">
  <Tile
    class={cx({border: filters["Connected"]}, "cursor-pointer")}
    background
    on:click={() => (filters["Connected"] = !filters["Connected"])}>
    <p class="text-lg sm:text-2xl">
      {Array.from(connectionsStatus["Connected"]?.values() || []).length || 0}
    </p>
    <span class="text-sm">Connected</span>
  </Tile>
  <Tile
    class={cx({border: filters["Logging in"]}, "cursor-pointer")}
    background
    on:click={() => (filters["Logging in"] = !filters["Logging in"])}>
    <p class="text-lg sm:text-2xl">
      {Array.from(connectionsStatus["Logging in"]?.values() || []).length || 0}
    </p>
    <span class="text-sm">Logging in</span>
  </Tile>
  <Tile
    class={cx({border: filters["Failed to log in"]}, "cursor-pointer")}
    background
    on:click={() => (filters["Failed to log in"] = !filters["Failed to log in"])}>
    <p class="text-lg sm:text-2xl">
      {Array.from(connectionsStatus["Failed to log in"]?.values() || []).length || 0}
    </p>
    <span class="text-sm">Login failed</span>
  </Tile>
  <Tile
    class={cx({border: filters["Failed to connect"]}, "cursor-pointer")}
    background
    on:click={() => (filters["Failed to connect"] = !filters["Failed to connect"])}
    lass="hidden sm:block">
    <p class="text-lg sm:text-2xl">
      {Array.from(connectionsStatus["Failed to connect"]?.values() || []).length || 0}
    </p>
    <span class="text-sm">Connection failed</span>
  </Tile>
  <Tile
    class={cx({border: filters["Waiting to reconnect"]}, "cursor-pointer")}
    background
    on:click={() => (filters["Waiting to reconnect"] = !filters["Waiting to reconnect"])}>
    <p class="text-lg sm:text-2xl">
      {Array.from(connectionsStatus["Waiting to reconnect"]?.values() || []).length || 0}
    </p>
    <span class="text-sm">Reconnecting</span>
  </Tile>
  <Tile
    class={cx({border: filters["Not connected"]}, "cursor-pointer")}
    background
    on:click={() => (filters["Not connected"] = !filters["Not connected"])}>
    <p class="text-lg sm:text-2xl">
      {Array.from(connectionsStatus["Not connected"]?.values() || []).length || 0}
    </p>
    <span class="text-sm">Not Connected</span>
  </Tile>
</div>
{#each connections as cxn (cxn.url)}
  {@const relay = $relaysByUrl.get(cxn.url)}
  <AltColor
    background
    class="cursor-pointer justify-between rounded-md p-6 shadow"
    on:click={() => {
      selected = cxn.url
      activeTab = "notices"
    }}>
    <div class="flex min-w-0 shrink-0 items-center gap-3">
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
      <div class="flex w-full justify-end gap-2">
        {#if getStatus(PublishStatus.Success, cxn).length > 0}
          {@const success = getStatus(PublishStatus.Success, cxn).length}
          <div class="flex items-center gap-2">
            <i class="fa fa-check-circle text-success"></i>{success || ""}
          </div>
        {/if}
        {#if getStatus(PublishStatus.Failure, cxn).length > 0}
          {@const failure = getStatus(PublishStatus.Failure, cxn).length}
          <div class="flex items-center gap-2">
            <i class="fa fa-times-circle text-danger"></i>{failure || ""}
          </div>
        {/if}
        {#if getStatus(PublishStatus.Pending, cxn).length > 0}
          {@const pending = getStatus(PublishStatus.Pending, cxn).length}
          <div class="flex items-center gap-2">
            <i class="fa fa-hourglass-half text-accent"></i>{pending || ""}
          </div>
        {/if}
        {#if getStatus(PublishStatus.Timeout, cxn).length > 0}
          {@const timeout = getStatus(PublishStatus.Pending, cxn).length}
          <div class="flex items-center gap-2">
            <i class="fa fa-clock"></i>{timeout || ""}
          </div>
        {/if}
      </div>
    </div>
  </AltColor>
{/each}
