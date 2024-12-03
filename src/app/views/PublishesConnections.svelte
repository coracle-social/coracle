<script lang="ts">
  import {relaysByUrl} from "@welshman/app"
  import {addToMapKey, ctx} from "@welshman/lib"
  import {throttled} from "@welshman/store"
  import {displayRelayUrl} from "@welshman/util"
  import {quantify} from "hurdak"
  import {onMount} from "svelte"
  import {writable, type Writable} from "svelte/store"
  import AltColor from "src/partials/AltColor.svelte"
  import SelectButton from "src/partials/SelectButton.svelte"
  import {ConnectionType} from "src/engine"
  import {getConnectionStatus} from "src/util/connection"

  export let selected: string
  export let activeTab: string

  let selectedOptions: string[] = []

  const connectionsStatus: Writable<Map<string, Set<string>>> = throttled(1000, writable(new Map()))
  const options = [
    ConnectionType.Connected,
    ConnectionType.Logging,
    ConnectionType.LoginFailed,
    ConnectionType.ConnectFailed,
    ConnectionType.WaitReconnect,
    ConnectionType.NotConnected,
    ConnectionType.UnstableConnection,
  ]

  $: connections = Array.from(ctx.net.pool.data.keys()).filter(url =>
    selectedOptions.length ? selectedOptions.some(s => $connectionsStatus.get(s)?.has(url)) : true,
  )

  onMount(() => {
    const interval = setInterval(() => {
      // make a copy of the connections
      const newConnectionStatus: Map<string, Set<string>> = new Map()
      for (const [url, cxn] of ctx.net.pool.data.entries()) {
        addToMapKey(newConnectionStatus, getConnectionStatus(cxn), url)
      }
      $connectionsStatus = newConnectionStatus
    }, 800)

    return () => {
      clearInterval(interval)
    }
  })
</script>

<SelectButton {options} bind:value={selectedOptions} multiple class="text-left">
  <div class="flex items-center gap-2" slot="item" let:option>
    {$connectionsStatus.get(option)?.size || 0}
    {option}
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
        {#each options.filter(o => $connectionsStatus.get(o)?.has(url)) as opt}
          <div class="flex items-center gap-2">
            <span>{opt}</span>
            <div
              class:!bg-danger={opt.includes("Failed") || opt.includes("Not")}
              class:!bg-warning={opt == "Logging in" ||
                opt == ConnectionType.WaitReconnect ||
                opt == ConnectionType.UnstableConnection}
              class="h-3 w-3 rounded-full bg-success" />
          </div>
        {/each}
      </div>
    </div>
  </AltColor>
{/each}
