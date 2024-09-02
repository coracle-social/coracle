<script lang="ts">
  import cx from "classnames"
  import {displayRelayUrl} from "@welshman/util"
  import {
    pubkey,
    signer,
    deriveRelay,
    getRelayUrls,
    getWriteRelayUrls,
    getReadRelayUrls,
    deriveRelaySelections,
    deriveInboxRelaySelections,
  } from "@welshman/app"
  import {quantify} from "hurdak"
  import {derived} from "svelte/store"
  import {stringToHue, displayUrl, hsl} from "src/util/misc"
  import {getAvgRating} from "src/util/nostr"
  import Chip from "src/partials/Chip.svelte"
  import Rating from "src/partials/Rating.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Popover from "src/partials/Popover.svelte"
  import RelayStatus from "src/app/shared/RelayStatus.svelte"
  import RelayCardActions from "src/app/shared/RelayCardActions.svelte"
  import {router} from "src/app/util/router"
  import {getSetting, setInboxPolicy, setOutboxPolicy} from "src/engine"

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
  const userRelaySelections = deriveRelaySelections($pubkey)
  const userInboxRelaySelections = deriveInboxRelaySelections($pubkey)
  const readRelayUrls = derived(userRelaySelections, getReadRelayUrls)
  const writeRelayUrls = derived(userRelaySelections, getWriteRelayUrls)
  const inboxRelayUrls = derived(userInboxRelaySelections, getRelayUrls)

  const policySetter = (mode: string) => () => {
    const read = $readRelayUrls.includes(url)
    const write = $writeRelayUrls.includes(url)
    const inbox = $inboxRelayUrls.includes(url)

    if (mode === "read") {
      setOutboxPolicy(url, !read, write)
    }

    if (mode === "write") {
      setOutboxPolicy(url, read, !write)
    }

    if (mode === "inbox") {
      setInboxPolicy(url, !inbox)
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
      {#if $relay?.profile?.description}
        <p>{$relay?.profile.description}</p>
      {/if}
    </slot>
    {#if $relay?.stats}
      <span class="flex items-center gap-1 text-sm text-neutral-400">
        {#if $relay?.profile?.contact}
          <Anchor external underline href={$relay.profile.contact}
            >{displayUrl($relay.profile.contact)}</Anchor>
          &bull;
        {/if}
        {#if $relay?.profile?.supported_nips}
          <Popover>
            <span slot="trigger" class="cursor-pointer underline">
              {$relay.profile.supported_nips.length} NIPs
            </span>
            <span slot="tooltip">
              NIPs supported: {$relay.profile.supported_nips.join(", ")}
            </span>
          </Popover>
          &bull;
        {/if}
        Connected {quantify($relay.stats.connect_count, "time")}
      </span>
    {/if}
  {/if}
  {#if showControls && $signer}
    <div class="-mx-6 my-1 h-px bg-tinted-700" />
    <div>
      <Popover triggerType="mouseenter" class="inline-block">
        <div slot="trigger">
          <Chip
            pad
            class={cx("cursor-pointer transition-opacity", {
              "opacity-50": !$readRelayUrls.includes(url),
            })}
            on:click={policySetter("read")}>
            <i class="fa fa-book-open text-neutral-300" /> Read
          </Chip>
        </div>
        <div slot="tooltip">
          Notes intended for you will {$readRelayUrls.includes(url) ? "" : "not"} be delivered to this
          relay.
        </div>
      </Popover>
      <Popover triggerType="mouseenter" class="inline-block">
        <div slot="trigger">
          <Chip
            pad
            class={cx("cursor-pointer transition-opacity", {
              "opacity-50": !$writeRelayUrls.includes(url),
            })}
            on:click={policySetter("write")}>
            <i class="fa fa-feather text-neutral-300" /> Write
          </Chip>
        </div>
        <div slot="tooltip">
          Notes you publish will {$writeRelayUrls.includes(url) ? "" : "not"} be sent to this relay.
        </div>
      </Popover>
      {#if $signer}
        <Popover triggerType="mouseenter" class="inline-block">
          <div slot="trigger">
            <Chip
              pad
              class={cx("cursor-pointer transition-opacity", {
                "opacity-50": !$inboxRelayUrls.includes(url),
              })}
              on:click={policySetter("inbox")}>
              <i class="fa fa-inbox text-neutral-300" /> Inbox
            </Chip>
          </div>
          <div slot="tooltip">
            Encrypted messages will {$inboxRelayUrls.includes(url) ? "" : "not"} be delivered to this
            relay.
          </div>
        </Popover>
      {/if}
    </div>
  {/if}
</div>
