<script lang="ts">
  import cx from "classnames"
  import {find, propEq} from "ramda"
  import {between} from "hurdak/lib/hurdak"
  import {onMount} from "svelte"
  import {fly} from "src/util/transition"
  import {poll, stringToHue, hsl} from "src/util/misc"
  import {displayRelay} from "src/util/nostr"
  import {modal} from "src/partials/state"
  import Toggle from "src/partials/Toggle.svelte"
  import Rating from "src/partials/Rating.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import pool from "src/agent/pool"
  import user from "src/agent/user"
  import {loadAppData} from "src/app/state"

  export let relay
  export let rating = null
  export let theme = "gray-8"
  export let showStatus = false
  export let hideActions = false
  export let showControls = false

  const {relays, canPublish} = user

  let statusHover = false
  let quality = null
  let message = null

  $: hasRelay = Boolean(find(propEq("url", relay.url), $relays))

  const removeRelay = r => user.removeRelay(r.url)

  const addRelay = r => {
    user.addRelay(r.url)

    const pubkey = user.getPubkey()
    const profile = user.getProfile()

    if (pubkey && !profile?.kind0) {
      loadAppData(pubkey)
    }
  }

  const openModal = () => {
    modal.push({type: "relay/detail", url: relay.url})
  }

  onMount(() => {
    return poll(10_000, () => {
      ;[quality, message] = pool.getQuality(relay.url)
    })
  })
</script>

<div
  class={cx(
    `bg-${theme}`,
    "flex flex-col justify-between gap-3 rounded-xl border border-l-2 border-solid border-gray-6 py-3 px-6 shadow"
  )}
  style={`border-left-color: ${hsl(stringToHue(relay.url))}`}
  in:fly={{y: 20}}>
  <div class="flex items-center justify-between gap-2">
    <div class="flex items-center gap-2 text-xl">
      <i class={relay.url.startsWith("ws://") ? "fa fa-unlock" : "fa fa-lock"} />
      <Anchor theme="unstyled" on:click={openModal}>{displayRelay(relay)}</Anchor>
      {#if showStatus}
        <span
          on:mouseout={() => {
            statusHover = false
          }}
          on:mouseover={() => {
            statusHover = true
          }}
          class="h-2 w-2 cursor-pointer rounded-full bg-gray-6"
          class:bg-gray-6={message === "Not connected"}
          class:bg-danger={quality <= 0.3 && message !== "Not connected"}
          class:bg-warning={between(0.3, 0.7, quality)}
          class:bg-success={quality > 0.7} />
        <p
          class="hidden text-sm text-gray-1 transition-all sm:block"
          class:opacity-0={!statusHover}
          class:opacity-1={statusHover}>
          {message}
        </p>
      {/if}
      {#if rating}
        <div class="px-4 text-sm" in:fly={{y: 20}}>
          <Rating inert value={rating} />
        </div>
      {/if}
    </div>
    {#if !hideActions}
      <slot name="actions">
        {#if !hasRelay}
          <button class="flex items-center gap-3 text-gray-1" on:click={() => addRelay(relay)}>
            <i class="fa fa-right-to-bracket" /> Join
          </button>
        {:else if $relays.length > 1}
          <button class="flex items-center gap-3 text-gray-1" on:click={() => removeRelay(relay)}>
            <i class="fa fa-right-from-bracket" /> Leave
          </button>
        {/if}
      </slot>
    {/if}
  </div>
  {#if relay.description}
    <p>{relay.description}</p>
  {/if}
  {#if hasRelay && showControls && $canPublish}
    <div class="-mx-6 my-1 h-px bg-gray-7" />
    <div class="flex justify-between gap-2">
      <span>Publish to this relay?</span>
      <Toggle
        value={relay.write}
        on:change={() => user.setRelayWriteCondition(relay.url, !relay.write)} />
    </div>
  {/if}
</div>
