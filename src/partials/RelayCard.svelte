<script lang="ts">
  import cx from 'classnames'
  import {last, find, propEq} from 'ramda'
  import {onMount} from 'svelte'
  import {poll, stringToColor} from "src/util/misc"
  import {between} from 'hurdak/lib/hurdak'
  import {fly} from 'svelte/transition'
  import Toggle from "src/partials/Toggle.svelte"
  import {user} from "src/agent/helpers"
  import pool from 'src/agent/pool'
  import {addRelay, removeRelay, setRelayWriteCondition} from "src/app"

  export let relay
  export let theme = 'dark'
  export let showControls = false

  let quality = null
  let message = null
  let showStatus = false
  let joined = false

  $: joined = find(propEq('url', relay.url), $user?.relays || [])

  onMount(() => {
    return poll(10_000, async () => {
      const conn = await pool.findConnection(relay.url)

      if (conn) {
        [quality, message] = conn.getQuality()
      } else {
        quality = null
        message = "Not connected"
      }
    })
  })
</script>

<div
  class={cx(
    `bg-${theme}`,
    "rounded border border-l-2 border-solid border-medium shadow flex flex-col justify-between gap-3 py-3 px-6"
  )}
  style={`border-left-color: ${stringToColor(relay.url)}`}
  in:fly={{y: 20}}>
  <div class="flex gap-2 items-center justify-between">
    <div class="flex gap-2 items-center text-xl">
      <i class={relay.url.startsWith('wss') ? "fa fa-lock" : "fa fa-unlock"} />
      <span>{last(relay.url.split('://'))}</span>
      <span
        on:mouseout={() => {showStatus = false}}
        on:mouseover={() => {showStatus = true}}
        class="w-2 h-2 rounded-full bg-medium cursor-pointer"
        class:bg-danger={quality <= 0.3}
        class:bg-warning={between(0.3, 0.7, quality)}
        class:bg-success={quality > 0.7}>
      </span>
      <p
        class="text-light text-sm transition-all hidden sm:block"
        class:opacity-0={!showStatus}
        class:opacity-1={showStatus}>
        {message}
      </p>
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
