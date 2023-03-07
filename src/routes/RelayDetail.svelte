<script lang="ts">
  import {find, propEq} from 'ramda'
  import {onMount} from 'svelte'
  import {poll, stringToColor} from "src/util/misc"
  import {displayRelay} from "src/util/nostr"
  import {between} from 'hurdak/lib/hurdak'
  import Content from "src/partials/Content.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Feed from "src/views/feed/Feed.svelte"
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

  document.title = displayRelay(relay)
</script>

<Content>
  <div class="flex gap-2 items-center justify-between">
    <div class="flex gap-2 items-center text-xl">
      <i class={relay.url.startsWith('wss') ? "fa fa-lock" : "fa fa-unlock"} />
      <span
        class="border-b border-solid"
        style={`border-color: ${stringToColor(relay.url)}`}>
        {displayRelay(relay)}
      </span>
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
    <div class="whitespace-nowrap flex gap-3 items-center flex-wrap">
      {#if relay.contact}
      <Anchor type="button-circle" href={`mailto:${relay.contact}`}>
        <i class="fa fa-envelope" />
      </Anchor>
      {/if}
      {#if joined}
      {#if $relays.length > 1}
      <Anchor
        type="button"
        class="flex gap-2 items-center rounded-full"
        on:click={() => user.removeRelay(relay.url)}>
        <i class="fa fa-right-from-bracket" /> Leave
      </Anchor>
      {/if}
      {:else}
      <Anchor
        type="button"
        class="flex gap-2 items-center rounded-full"
        on:click={() => user.addRelay(relay.url)}>
        <i class="fa fa-right-to-bracket" /> Join
      </Anchor>
      {/if}
    </div>
  </div>
  {#if relay.description}
  <p>{relay.description}</p>
  {/if}
</Content>
<div class="border-b border-solid border-medium" />
<Content>
  <Feed relays={[relay]} filter={{kinds: [1]}} />
</Content>
