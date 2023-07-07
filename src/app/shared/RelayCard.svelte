<script lang="ts">
  import cx from "classnames"
  import {between} from "hurdak/lib/hurdak"
  import {onMount} from "svelte"
  import {fly} from "src/util/transition"
  import {poll, stringToHue, hsl} from "src/util/misc"
  import {modal} from "src/partials/state"
  import Toggle from "src/partials/Toggle.svelte"
  import Rating from "src/partials/Rating.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import {keys, routing, directory} from "src/system"
  import {watch} from "src/util/loki"
  import pool from "src/agent/pool"
  import {loadAppData} from "src/app/state"

  export let relay
  export let rating = null
  export let theme = "gray-8"
  export let showStatus = false
  export let hideActions = false
  export let showControls = false

  const {canSign} = keys

  let statusHover = false
  let quality = null
  let message = null

  const relays = watch(routing.policies, () => new Set(routing.getUserRelayUrls()))

  const removeRelay = r => routing.removeUserRelay(r.url)

  const addRelay = r => {
    routing.addUserRelay(r.url)

    const pubkey = keys.getPubkey()

    if (pubkey && !directory.getUserProfile().created_at) {
      loadAppData(pubkey)
    }
  }

  const openModal = () => {
    modal.push({type: "relay/detail", url: relay.url})
  }

  $: hasRelay = $relays.includes(relay.url)

  onMount(() => {
    return poll(10_000, () => {
      ;[quality, message] = pool.getQuality(relay.url)
    })
  })
</script>

<div
  class={cx(
    `bg-${theme}`,
    "flex flex-col justify-between gap-3 rounded-xl border border-l-2 border-solid border-gray-6 px-6 py-3 shadow"
  )}
  style={`border-left-color: ${hsl(stringToHue(relay.url))}`}
  in:fly={{y: 20}}>
  <div class="flex items-center justify-between gap-2">
    <div class="flex items-center gap-2 text-xl">
      <i class={relay.url.startsWith("ws://") ? "fa fa-unlock" : "fa fa-lock"} />
      <Anchor on:click={openModal}>{routing.displayRelay(relay)}</Anchor>
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
        {:else if $relays.size > 1}
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
  {#if hasRelay && showControls && $canSign}
    <div class="-mx-6 my-1 h-px bg-gray-7" />
    <div class="flex justify-between gap-2">
      <span>Publish to this relay?</span>
      <Toggle
        value={relay.write}
        on:change={() => routing.setUserRelayPolicy(relay.url, {write: !relay.write})} />
    </div>
  {/if}
</div>
