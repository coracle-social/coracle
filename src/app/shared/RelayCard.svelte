<script lang="ts">
  import cx from "classnames"
  import {displayRelayUrl} from "@welshman/util"
  import {
    signer,
    deriveRelay,
    getRelayUrls,
    getWriteRelayUrls,
    getReadRelayUrls,
    userRelaySelections,
    userInboxRelaySelections,
  } from "@welshman/app"
  import {quantify} from "hurdak"
  import {derived} from "svelte/store"
  import {displayUrl} from "src/util/misc"
  import {getAvgRating} from "src/util/nostr"
  import AltColor from "src/partials/AltColor.svelte"
  import Chip from "src/partials/Chip.svelte"
  import Rating from "src/partials/Rating.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Popover from "src/partials/Popover.svelte"
  import RelayStatus from "src/app/shared/RelayStatus.svelte"
  import RelayCardActions from "src/app/shared/RelayCardActions.svelte"
  import {getSetting, setInboxPolicy, setOutboxPolicy} from "src/engine"
  import {slide} from "svelte/transition"
  import Modal from "src/partials/Modal.svelte"

  export let url
  export let claim = null
  export let ratings = null
  export let showStatus = false
  export let hideRatingsCount = false
  export let hideActions = false
  export let showControls = false

  let innerWidth = 0

  const relay = deriveRelay(url)
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

  let details = false

  function close() {
    details = false
  }

  $: isMobile = innerWidth < 768
</script>

<svelte:window bind:innerWidth />

<AltColor background class="justify-between rounded-md p-6 shadow">
  <div class="flex items-center justify-between gap-2">
    <div class="flex min-w-0 shrink-0 items-center gap-3">
      {#if $relay?.profile?.icon}
        <img class="h-9 w-9 rounded-full border" src={$relay.profile.icon} />
      {:else}
        <div class="flex h-9 w-9 items-center justify-center rounded-full border">
          <i class="fa fa-server text-xl text-neutral-100"></i>
        </div>
      {/if}
      <div>
        <div class="flex items-center gap-2">
          <div class="text-md overflow-hidden text-ellipsis whitespace-nowrap">
            {displayRelayUrl(url)}
          </div>
          {#if showStatus && !getSetting("multiplextr_url")}
            <RelayStatus {url} />
          {/if}
        </div>
        <div class="flex gap-4 text-xs text-neutral-400">
          {#if $relay?.profile?.supported_nips}
            <span>
              {$relay.profile.supported_nips.length} NIPs
            </span>
          {/if}
          <span>
            Connected {quantify($relay.stats?.connect_count || 0, "time")}
          </span>
        </div>
      </div>

      {#if !showStatus && ratings?.length > 0}
        <div class="hidden items-center gap-1 px-4 text-sm sm:flex">
          <Rating inert value={getAvgRating(ratings)} />
          {#if !hideRatingsCount}
            <span class="text-neutral-400">({ratings.length} reviews)</span>
          {/if}
        </div>
      {/if}
    </div>
    {#if !hideActions}
      <slot name="actions">
        <RelayCardActions {url} {claim} bind:details />
      </slot>
    {/if}
  </div>
  {#if details}
    <div transition:slide class="hidden md:flex flex-col gap-2 py-2">
      {#if $relay?.stats}
        <span class="flex items-center gap-1 text-sm">
          {#if $relay?.profile?.contact}
            <span class="opacity-75">Contact: </span>
            <Anchor external underline href={$relay.profile.contact}>
              {displayUrl($relay.profile.contact)}</Anchor>
          {/if}
        </span>
      {/if}
      <slot name="description text-sm">
        {#if $relay?.profile?.description}
          {$relay?.profile.description}
        {/if}
      </slot>
      {#if $relay?.profile?.supported_nips}
        <div class="text-sm opacity-75">
          Supported NIPs: {$relay?.profile?.supported_nips.join(", ")}
        </div>
      {/if}
    </div>
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
</AltColor>

{#if isMobile && details}
  <Modal mini onEscape={close}>
    <div class="flex flex-col gap-2">
      {#if $relay?.stats}
        <span class="flex items-center gap-1">
          {#if $relay?.profile?.contact}
            <span class="opacity-75">Contact: </span>
            <Anchor external underline href={$relay.profile.contact}>
              {displayUrl($relay.profile.contact)}</Anchor>
          {/if}
        </span>
      {/if}
      <slot name="description">
        {#if $relay?.profile?.description}
          <p>{$relay?.profile.description}</p>
        {/if}
      </slot>
      {#if $relay?.profile?.supported_nips}
        <span class="opacity-75">Supported NIPs: </span>{$relay?.profile?.supported_nips.join(", ")}
      {/if}
    </div>
  </Modal>
{/if}
