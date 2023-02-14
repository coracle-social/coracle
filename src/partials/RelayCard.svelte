<script lang="ts">
  import {last, find, propEq} from 'ramda'
  import {onMount} from 'svelte'
  import {poll} from "src/util/misc"
  import {switcher} from 'hurdak/lib/hurdak'
  import {fly} from 'svelte/transition'
  import Toggle from "src/partials/Toggle.svelte"
  import {user} from "src/agent/helpers"
  import pool from 'src/agent/pool'
  import {addRelay, removeRelay, setRelayWriteCondition} from "src/app"

  export let relay
  export let showControls = false

  let status = null
  let showStatus = false
  let joined = false

  $: joined = find(propEq('url', relay.url), $user?.relays || [])

  onMount(() => {
    return poll(300, async () => {
      const conn = find(propEq('url', relay.url), pool.getConnections())

      if (conn) {
        const slow = conn.status === 'ready' && conn.stats.timer / conn.stats.count > 1000

        // Be more strict here than with alerts
        status = slow ? 'slow' : conn.status
      }
    })
  })
</script>

<div
  class="rounded border border-solid border-medium bg-dark shadow flex flex-col justify-between gap-3 py-3 px-6"
  in:fly={{y: 20}}>
  <div class="flex gap-2 items-center justify-between">
    <div class="flex gap-2 items-center text-xl">
      <i class={relay.url.startsWith('wss') ? "fa fa-lock" : "fa fa-unlock"} />
      <span>{last(relay.url.split('://'))}</span>
      {#if joined}
      <span
        on:mouseout={() => {showStatus = false}}
        on:mouseover={() => {showStatus = true}}
        class="w-2 h-2 rounded-full bg-medium cursor-pointer"
        class:bg-danger={['pending', 'error'].includes(status)}
        class:bg-warning={status === 'slow'}
        class:bg-success={status === 'ready'}>
      </span>
      <p
        class="text-light text-sm transition-all hidden sm:block"
        class:opacity-0={!showStatus}
        class:opacity-1={showStatus}>
        {switcher(status, {
          error: 'Not connected',
          pending: 'Trying to connect',
          slow: 'Slow connection',
          ready: 'Connected',
          default: 'Waiting to reconnect',
        })}
      </p>
      {/if}
    </div>
    {#if joined}
    <button class="flex gap-3 items-center text-light" on:click={() => removeRelay(relay.url)}>
      <i class="fa fa-right-from-bracket" /> Leave
    </button>
    {:else}
    <button class="flex gap-3 items-center text-light" on:click={() => addRelay(relay.url)}>
      <i class="fa fa-right-to-bracket" /> Join
    </button>
    {/if}
  </div>
  {#if relay.description}
  <p>{relay.description}</p>
  {/if}
  {#if joined && showControls}
  <div class="border-b border-solid border-medium -mx-6" />
  <div class="flex justify-between gap-2">
    <span>Publish to this relay?</span>
    <Toggle
      value={relay.write !== "!"}
      on:change={() => setRelayWriteCondition(relay.url, relay.write === "!" ? "" : "!")} />
  </div>
  {/if}
</div>
