<script lang="ts">
  import cx from 'classnames'
  import {last} from 'ramda'
  import {onMount} from 'svelte'
  import {poll, stringToColor} from "src/util/misc"
  import {between} from 'hurdak/lib/hurdak'
  import {fly} from 'svelte/transition'
  import Anchor from "src/partials/Anchor.svelte"
  import pool from 'src/agent/pool'

  export let relay
  export let theme = 'dark'
  export let removeRelay = null
  export let addRelay = null

  let quality = null
  let message = null
  let showStatus = false

  onMount(() => {
    return poll(10_000, async () => {
      const conn = await pool.getConnection(relay.url)

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
      <Anchor type="unstyled" href={`/relays/${btoa(relay.url)}`}>
        {last(relay.url.split('://'))}
      </Anchor>
      <span
        on:mouseout={() => {showStatus = false}}
        on:mouseover={() => {showStatus = true}}
        class="w-2 h-2 rounded-full bg-medium cursor-pointer"
        class:bg-medium={message === 'Not connected'}
        class:bg-danger={quality <= 0.3 && message !== 'Not connected'}
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
    {#if removeRelay}
    <button
      class="flex gap-3 items-center text-light"
      on:click={() => removeRelay(relay)}>
      <i class="fa fa-right-from-bracket" /> Leave
    </button>
    {/if}
    {#if addRelay}
    <button
      class="flex gap-3 items-center text-light"
      on:click={() => addRelay(relay)}>
      <i class="fa fa-right-to-bracket" /> Join
    </button>
    {/if}
  </div>
  {#if relay.description}
  <p>{relay.description}</p>
  {/if}
  <slot name="controls" />
</div>
