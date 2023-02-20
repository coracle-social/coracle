<script lang="ts">
  import {last, find, propEq} from 'ramda'
  import {onMount} from 'svelte'
  import {poll} from "src/util/misc"
  import {between} from 'hurdak/lib/hurdak'
  import Content from "src/partials/Content.svelte"
  import Feed from "src/views/notes/Feed.svelte"
  import database from 'src/agent/database'
  import pool from 'src/agent/pool'
  import user from "src/agent/user"

  export let url

  const relay = database.relays.get(url) || {url}

  let quality = null
  let message = null
  let showStatus = false
  let joined = false

  const {relays} = user

  $: joined = find(propEq('url', relay.url), $relays)

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

<Content>
  <div class="flex gap-2 items-center justify-between">
    <div class="flex gap-2 items-center text-xl">
      <i class={relay.url.startsWith('wss') ? "fa fa-lock" : "fa fa-unlock"} />
      <span>{last(relay.url.split('://'))}</span>
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
    {#if joined}
    {#if $relays.length > 1}
    <button
      class="flex gap-3 items-center text-light"
      on:click={() => user.removeRelay(relay.url)}>
      <i class="fa fa-right-from-bracket" /> Leave
    </button>
    {/if}
    {:else}
    <button
      class="flex gap-3 items-center text-light"
      on:click={() => user.addRelay(relay.url)}>
      <i class="fa fa-right-to-bracket" /> Join
    </button>
    {/if}
  </div>
  {#if relay.description}
  <p>{relay.description}</p>
  {/if}
  <div class="border-b border-solid border-medium -mx-6" />
  <Feed relays={[relay]} filter={{kinds: [1]}} />
</Content>
