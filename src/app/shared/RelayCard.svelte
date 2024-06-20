<script lang="ts">
  import cx from "classnames"
  import {isNil} from "ramda"
  import {quantify} from "hurdak"
  import {stringToHue, displayUrl, hsl} from "src/util/misc"
  import {getAvgRating} from "src/util/nostr"
  import Chip from "src/partials/Chip.svelte"
  import Rating from "src/partials/Rating.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Popover from "src/partials/Popover.svelte"
  import RelayStatus from "src/app/shared/RelayStatus.svelte"
  import RelayCardActions from "src/app/shared/RelayCardActions.svelte"
  import {router} from "src/app/util/router"
  import {displayRelayUrl, RelayMode} from "src/domain"
  import {
    deriveRelay,
    canSign,
    getSetting,
    setInboxPolicy,
    setOutboxPolicy,
    deriveUserRelayPolicy,
  } from "src/engine"

  export let url
  export let claim = null
  export let ratings = null
  export let showStatus = false
  export let hideDescription = false
  export let hideRatingsCount = false
  export let hideActions = false
  export let showControls = false
  export let inert = false

  const relay = deriveRelay(url)
  const policy = deriveUserRelayPolicy(url)

  const policySetter = mode => () => {
    const newPolicy = {...$policy, [mode]: !$policy[mode]}

    if (mode === RelayMode.Inbox) {
      setInboxPolicy(newPolicy)
    } else {
      setOutboxPolicy(newPolicy)
    }
  }
</script>

<div
  class="flex flex-col justify-between gap-3 rounded-xl border border-l-2 border-solid border-neutral-600 bg-neutral-800 px-6 py-3 shadow"
  style={`border-left-color: ${hsl(stringToHue(url))}`}>
  <div class="flex items-center justify-between gap-2">
    <div class="flex min-w-0 items-center gap-2 text-xl">
      {#if inert}
        <div class="overflow-hidden text-ellipsis whitespace-nowrap">
          {displayRelayUrl(url)}
        </div>
      {:else}
        <Anchor
          modal
          href={router.at("relays").of(url).toString()}
          class="overflow-hidden text-ellipsis whitespace-nowrap">
          {displayRelayUrl(url)}
        </Anchor>
      {/if}
      {#if showStatus && !getSetting("multiplextr_url")}
        <RelayStatus {url} />
      {/if}
      {#if !showStatus && ratings?.length > 0}
        <div class="flex items-center gap-1 px-4 text-sm">
          <Rating inert value={getAvgRating(ratings)} />
          {#if !hideRatingsCount}
            <span class="text-neutral-400">({ratings.length} reviews)</span>
          {/if}
        </div>
      {/if}
    </div>
    {#if !hideActions}
      <slot name="actions">
        <RelayCardActions {url} {claim} />
      </slot>
    {/if}
  </div>
  {#if !hideDescription}
    <slot name="description">
      {#if $relay.description}
        <p>{$relay.description}</p>
      {/if}
    </slot>
    {#if !isNil($relay.count)}
      <span class="flex items-center gap-1 text-sm text-neutral-400">
        {#if $relay.contact}
          <Anchor external underline href={$relay.contact}>{displayUrl($relay.contact)}</Anchor>
          &bull;
        {/if}
        {#if $relay.supported_nips}
          <Popover>
            <span slot="trigger" class="cursor-pointer underline">
              {$relay.supported_nips.length} NIPs
            </span>
            <span slot="tooltip">
              NIPs supported: {$relay.supported_nips.join(", ")}
            </span>
          </Popover>
          &bull;
        {/if}
        Seen {quantify($relay.count || 0, "time")}
      </span>
    {/if}
  {/if}
  {#if showControls && $canSign}
    <div class="-mx-6 my-1 h-px bg-tinted-700" />
    <div>
      <Popover triggerType="mouseenter" class="inline-block">
        <div slot="trigger">
          <Chip
            pad
            class={cx("cursor-pointer transition-opacity", {"opacity-50": !$policy.read})}
            on:click={policySetter(RelayMode.Read)}>
            <i class="fa fa-book-open text-neutral-300" /> Read
          </Chip>
        </div>
        <div slot="tooltip">
          Notes intended for you will {$policy.read ? "" : "not"} be delivered to this relay.
        </div>
      </Popover>
      <Popover triggerType="mouseenter" class="inline-block">
        <div slot="trigger">
          <Chip
            pad
            class={cx("cursor-pointer transition-opacity", {"opacity-50": !$policy.write})}
            on:click={policySetter(RelayMode.Write)}>
            <i class="fa fa-feather text-neutral-300" /> Write
          </Chip>
        </div>
        <div slot="tooltip">
          Notes you publish will {$policy.write ? "" : "not"} be sent to this relay.
        </div>
      </Popover>
      {#if $canSign}
        <Popover triggerType="mouseenter" class="inline-block">
          <div slot="trigger">
            <Chip
              pad
              class={cx("cursor-pointer transition-opacity", {"opacity-50": !$policy.inbox})}
              on:click={policySetter(RelayMode.Inbox)}>
              <i class="fa fa-inbox text-neutral-300" /> Inbox
            </Chip>
          </div>
          <div slot="tooltip">
            Encrypted messages will {$policy.inbox ? "" : "not"} be delivered to this relay.
          </div>
        </Popover>
      {/if}
    </div>
  {/if}
</div>
