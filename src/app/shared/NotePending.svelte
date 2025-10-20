<style>
  .loading-bar::after {
    content: "";
    position: absolute;
    top: 0;
    right: -50px;
    width: 50px;
    height: 100%;
    background: linear-gradient(to left, rgba(0, 0, 0, 0), var(--accent));
  }

  .loading-bar-content > * {
    @apply z-feature;
  }
</style>

<script lang="ts">
  import {remove} from "@welshman/lib"
  import {abortThunk, getCompleteThunkUrls, getThunkUrlsWithStatus} from "@welshman/app"
  import type {Thunk} from "@welshman/app"
  import {PublishStatus, LOCAL_RELAY_URL} from "@welshman/net"
  import {tweened} from "svelte/motion"
  import {userSettings} from "src/engine"
  import Link from "src/partials/Link.svelte"
  import {ticker} from "src/util/misc"

  export let thunk: Thunk
  export let onReplyAbort: (thunk: Thunk) => void

  const elapsed = ticker()

  const completedDisplay = tweened(0)

  const abort = () => {
    abortThunk(thunk)
    onReplyAbort(thunk)
  }

  $: relays = remove(LOCAL_RELAY_URL, $thunk?.options?.relays)
  $: completed = remove(LOCAL_RELAY_URL, getCompleteThunkUrls($thunk))
  $: sending = remove(LOCAL_RELAY_URL, getThunkUrlsWithStatus(PublishStatus.Sending, $thunk))
  $: pending = remove(LOCAL_RELAY_URL, getThunkUrlsWithStatus(PublishStatus.Pending, $thunk))
  $: success = remove(LOCAL_RELAY_URL, getThunkUrlsWithStatus(PublishStatus.Success, $thunk))
  $: showProgress = sending.length === 0
  $: completedDisplay.set((completed.length / relays.length) * 80)
  $: remaining = Math.ceil($userSettings.send_delay / 1000) - $elapsed
</script>

{#if $thunk}
  <div
    on:click|stopPropagation
    class="loading-bar-content relative flex h-6 w-full items-center justify-between overflow-hidden rounded-md pl-4 text-sm"
    class:bg-neutral-500={showProgress}
    class:border={!showProgress}
    class:px-4={pending.length > 0}>
    {#if showProgress}
      <div
        class="loading-bar absolute left-0 top-0 h-full bg-accent"
        style="width: {20 + $completedDisplay}%" />
      {#if pending.length > 0}
        <span class="sm:hidden">
          {success.length}/{relays.length} relays
        </span>
        <span class="hidden sm:inline">
          Publishing... {relays.length - pending.length} of {relays.length} relays
        </span>
      {:else}
        <span class="sm:hidden">
          {success.length}/{relays.length} relays
        </span>
        <span class="hidden sm:inline">
          Published to {success.length}/{relays.length} relays
        </span>
        <Link
          modal
          class="staatliches z-feature rounded-r-md bg-tinted-100-d px-4 py-1 uppercase text-tinted-700-d"
          href="/publishes">
          <span class="sm:hidden"> Details </span>
          <span class="hidden sm:inline"> See details </span>
        </Link>
      {/if}
    {:else if $userSettings.send_delay > 0}
      <span class="hidden sm:inline">
        Sending reply in {remaining} seconds
      </span>
      <span class="sm:hidden">
        Sending in {remaining}s
      </span>
      <button
        class="ml-2 cursor-pointer rounded-md bg-neutral-100-d px-4 py-1 text-tinted-700-d"
        on:click={abort}>Cancel</button>
    {/if}
  </div>
{/if}
