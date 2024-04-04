<script lang="ts">
  import cx from "classnames"
  import {isNil} from "ramda"
  import {quantify} from "hurdak"
  import {stringToHue, displayUrl, hsl} from "src/util/misc"
  import Chip from "src/partials/Chip.svelte"
  import Rating from "src/partials/Rating.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Popover from "src/partials/Popover.svelte"
  import RelayStatus from "src/app/shared/RelayStatus.svelte"
  import RelayCardActions from "src/app/shared/RelayCardActions.svelte"
  import {router} from "src/app/router"
  import {canSign, getSetting, displayRelay, setRelayPolicy} from "src/engine"

  export let relay
  export let claim = null
  export let rating = null
  export let showStatus = false
  export let hideActions = false
  export let showControls = false
  export let inert = false

  const policySetter = mode => () => {
    relay = {...relay, [mode]: !relay[mode]}
    setRelayPolicy(relay.url, relay)
  }
</script>

<div
  class="flex flex-col justify-between gap-3 rounded-xl border border-l-2 border-solid border-neutral-600 bg-neutral-800 px-6 py-3 shadow"
  style={`border-left-color: ${hsl(stringToHue(relay.url))}`}>
  <div class="flex items-center justify-between gap-2">
    <div class="flex min-w-0 items-center gap-2 text-xl">
      {#if inert}
        <div class="overflow-hidden text-ellipsis whitespace-nowrap">
          {displayRelay(relay)}
        </div>
      {:else}
        <Anchor
          modal
          href={router.at("relays").of(relay.url).toString()}
          class="overflow-hidden text-ellipsis whitespace-nowrap">
          {displayRelay(relay)}
        </Anchor>
      {/if}
      {#if showStatus && !getSetting("multiplextr_url")}
        <RelayStatus {relay} />
      {/if}
      {#if rating}
        <div class="px-4 text-sm">
          <Rating inert value={rating} />
        </div>
      {/if}
    </div>
    {#if !hideActions}
      <slot name="actions">
        <RelayCardActions {relay} {claim} />
      </slot>
    {/if}
  </div>
  {#if relay.description}
    <p>{relay.description}</p>
  {/if}
  {#if !isNil(relay.count)}
    <span class="flex items-center gap-1 text-sm text-neutral-400">
      {#if relay.contact}
        <Anchor external underline href={relay.contact}>{displayUrl(relay.contact)}</Anchor>
        &bull;
      {/if}
      {#if relay.supported_nips}
        <Popover>
          <span slot="trigger" class="cursor-pointer underline">
            {relay.supported_nips.length} NIPs
          </span>
          <span slot="tooltip">
            NIPs supported: {relay.supported_nips.join(", ")}
          </span>
        </Popover>
        &bull;
      {/if}
      Seen {quantify(relay.count || 0, "time")}
    </span>
  {/if}
  {#if showControls && $canSign}
    <div class="-mx-6 my-1 h-px bg-tinted-700" />
    <div>
      <Chip
        pad
        class={cx("cursor-pointer transition-opacity", {"opacity-50": !relay.read})}
        on:click={policySetter("read")}>
        <i class="fa fa-book-open text-neutral-300" /> Read
      </Chip>
      <Chip
        pad
        class={cx("cursor-pointer transition-opacity", {"opacity-50": !relay.write})}
        on:click={policySetter("write")}>
        <i class="fa fa-feather text-neutral-300" /> Write
      </Chip>
    </div>
  {/if}
</div>
