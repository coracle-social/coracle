<script lang="ts">
  import cx from "classnames"
  import {fly} from "src/util/transition"
  import {stringToHue, hsl} from "src/util/misc"
  import Toggle from "src/partials/Toggle.svelte"
  import Rating from "src/partials/Rating.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import RelayStatus from "src/app/shared/RelayStatus.svelte"
  import RelayCardActions from "src/app/shared/RelayCardActions.svelte"
  import {router} from "src/app/router"
  import {canSign, getSetting, displayRelay, setRelayPolicy} from "src/engine"

  export let relay
  export let rating = null
  export let theme = "gray-8"
  export let showStatus = false
  export let hideActions = false
  export let showControls = false
</script>

<div
  class={cx(
    `bg-${theme}`,
    "flex flex-col justify-between gap-3 rounded-xl border border-l-2 border-solid border-gray-6 px-6 py-3 shadow"
  )}
  style={`border-left-color: ${hsl(stringToHue(relay.url))}`}
  in:fly={{y: 20}}>
  <div class="flex items-center justify-between gap-2">
    <div class="flex items-center gap-2 text-xl min-w-0">
      <i class={relay.url.startsWith("ws://") ? "fa fa-unlock" : "fa fa-lock"} />
      <Anchor href={router.at("relays").of(relay.url).path} class="overflow-hidden whitespace-nowrap text-ellipsis">
        {displayRelay(relay)}
      </Anchor>
      {#if showStatus && !getSetting("multiplextr_url")}
        <RelayStatus {relay} />
      {/if}
      {#if rating}
        <div class="px-4 text-sm" in:fly={{y: 20}}>
          <Rating inert value={rating} />
        </div>
      {/if}
    </div>
    {#if !hideActions}
      <slot name="actions">
        <RelayCardActions {relay} />
      </slot>
    {/if}
  </div>
  {#if relay.description}
    <p>{relay.description}</p>
  {/if}
  {#if showControls && $canSign}
    <div class="-mx-6 my-1 h-px bg-gray-7" />
    <div class="flex justify-between gap-2">
      <span>Publish to this relay?</span>
      <Toggle
        value={relay.write}
        on:change={() => setRelayPolicy(relay.url, {write: !relay.write})} />
    </div>
  {/if}
</div>
