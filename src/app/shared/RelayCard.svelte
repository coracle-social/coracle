<script lang="ts">
  import cx from "classnames"
  import {between, poll} from "hurdak"
  import {onMount} from "svelte"
  import {fly} from "src/util/transition"
  import {stringToHue, hsl} from "src/util/misc"
  import {modal} from "src/partials/state"
  import Toggle from "src/partials/Toggle.svelte"
  import Rating from "src/partials/Rating.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import {User, Nip65, Keys, Network} from "src/app/engine"

  export let relay
  export let rating = null
  export let theme = "gray-8"
  export let showStatus = false
  export let hideActions = false
  export let showControls = false

  let statusHover = false
  let meta = null

  const relays = Nip65.policies.key(Keys.pubkey.get()).derived(() => new Set(User.getRelayUrls()))

  const removeRelay = r => User.removeRelay(r.url)

  const addRelay = r => User.addRelay(r.url)

  const openModal = () => {
    modal.push({type: "relay/detail", url: relay.url})
  }

  $: hasRelay = $relays.has(relay.url)

  onMount(() => {
    return poll(3000, () => {
      const socket = Network.pool.get(relay.url, {autoConnect: false})

      meta = socket?.meta
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
      <Anchor on:click={openModal}>{Nip65.displayRelay(relay)}</Anchor>
      {#if showStatus}
        <span
          on:mouseout={() => {
            statusHover = false
          }}
          on:mouseover={() => {
            statusHover = true
          }}
          class="h-2 w-2 cursor-pointer rounded-full bg-gray-6"
          class:bg-gray-6={!meta}
          class:bg-danger={meta && meta.quality <= 0.3}
          class:bg-warning={meta && between(0.3, 0.7, meta.quality)}
          class:bg-success={meta && meta.quality > 0.7} />
        <p
          class="hidden text-sm text-gray-1 transition-all sm:block"
          class:opacity-0={!statusHover}
          class:opacity-1={statusHover}>
          {meta ? meta.description : "Not connected"}
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
  {#if hasRelay && showControls && Keys.canSign.get()}
    <div class="-mx-6 my-1 h-px bg-gray-7" />
    <div class="flex justify-between gap-2">
      <span>Publish to this relay?</span>
      <Toggle
        value={relay.write}
        on:change={() => User.setRelayPolicy(relay.url, {write: !relay.write})} />
    </div>
  {/if}
</div>
