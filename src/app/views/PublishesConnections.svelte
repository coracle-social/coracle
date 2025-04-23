<script lang="ts">
  import {relaysByUrl} from "@welshman/app"
  import {addToMapKey} from "@welshman/lib"
  import {Pool} from "@welshman/net"
  import {displayRelayUrl} from "@welshman/util"
  import {onMount} from "svelte"
  import AltColor from "src/partials/AltColor.svelte"
  import SelectButton from "src/partials/SelectButton.svelte"
  import {ConnectionType, displayConnectionType, getSocketStatus} from "src/domain/connection"
  import {quantify} from "src/util/misc"

  export let selected: string
  export let activeTab: string

  let selectedOptions: ConnectionType[] = []
  let connectionsStatus: Map<ConnectionType, Set<string>> = new Map()

  const options = [
    ConnectionType.Connected,
    ConnectionType.Logging,
    ConnectionType.LoginFailed,
    ConnectionType.ConnectFailed,
    ConnectionType.WaitReconnect,
    ConnectionType.NotConnected,
    ConnectionType.UnstableConnection,
  ]

  $: connections = Array.from(Pool.get()._data.keys()).filter(url =>
    selectedOptions.length ? selectedOptions.some(s => connectionsStatus.get(s)?.has(url)) : true,
  )

  function fetchConnectionStatus() {
    const newConnectionStatus: Map<ConnectionType, Set<string>> = new Map()
    for (const [url, socket] of Pool.get()._data.entries()) {
      addToMapKey(newConnectionStatus, getSocketStatus(socket), url)
    }
    connectionsStatus = newConnectionStatus
  }

  onMount(() => {
    fetchConnectionStatus()
    const interval = setInterval(fetchConnectionStatus, 800)

    return () => {
      clearInterval(interval)
    }
  })
</script>

<SelectButton {options} bind:value={selectedOptions} multiple class="text-left">
  <div class="flex items-center gap-2" slot="item" let:option>
    {connectionsStatus.get(option)?.size || 0}
    {displayConnectionType(option)}
  </div>
</SelectButton>
{#each connections as url (url)}
  {@const relay = $relaysByUrl.get(url)}
  <AltColor
    background
    class="cursor-pointer justify-between rounded-md p-6 shadow"
    on:click={() => {
      selected = url
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
            {displayRelayUrl(url)}
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
        {#each options.filter(o => connectionsStatus.get(o)?.has(url)) as o}
          {@const opt = displayConnectionType(o)}
          <div class="flex items-center gap-2">
            <span>{opt}</span>
            <div
              class:!bg-danger={opt.includes("Failed") || opt.includes("Not")}
              class:!bg-warning={opt === "Logging in" ||
                o === ConnectionType.WaitReconnect ||
                o === ConnectionType.UnstableConnection}
              class="h-3 w-3 rounded-full bg-success" />
          </div>
        {/each}
      </div>
    </div>
  </AltColor>
{/each}
