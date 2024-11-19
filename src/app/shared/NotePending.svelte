<style>
  .loading-bar {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
  }

  div.loading-bar::after {
    content: "";
    position: absolute;
    top: 0;
    right: -50px;
    width: 50px;
    height: 100%;
    background: linear-gradient(to left, rgba(0, 0, 0, 0), var(--accent));
  }

  .loading-bar-content > * {
    z-index: 1;
  }
</style>

<script lang="ts">
  import {thunks, type Thunk} from "@welshman/app"
  import {PublishStatus} from "@welshman/net"
  import {LOCAL_RELAY_URL, type SignedEvent} from "@welshman/util"
  import {userSettings} from "src/engine"
  import Anchor from "src/partials/Anchor.svelte"
  import {timestamp1} from "src/util/misc"
  import {spring} from "svelte/motion"

  export let event: SignedEvent
  export let removeDraft: () => void

  $: thunk = $thunks[event.id] as Thunk

  $: status = thunk?.status
  $: relays = thunk?.request?.relays.filter(r => r !== LOCAL_RELAY_URL)
  $: statuses = Object.entries($status || {})
    .filter(([k, v]) => k !== LOCAL_RELAY_URL)
    .map(([k, v]) => v)
  $: pendings = statuses.filter(s => s.status === PublishStatus.Pending).length
  $: failed = statuses.filter(
    s => s.status === PublishStatus.Failure || s.status === PublishStatus.Aborted,
  ).length
  $: timeout = statuses.filter(s => s.status === PublishStatus.Timeout).length
  $: success = statuses.filter(s => s.status === PublishStatus.Success).length
  $: total = relays.length || 0

  const completed = spring(0)

  $: {
    if (thunk) {
      $completed = ((total - pendings) / total) * 100
    }
  }

  $: isPending = pendings > 0
  $: isCompleted = total === success + failed + timeout
</script>

<div
  class="loading-bar-content relative flex h-6 w-full items-center justify-between overflow-hidden rounded-md pl-4 text-sm"
  class:border={!thunk}
  on:click|stopPropagation>
  {#if thunk && (isPending || isCompleted)}
    <div class="loading-bar bg-accent" style="width: {$completed}%"></div>
    {#if isPending}
      <span>Publishing...</span>
      <span>{total - pendings} of {total} relays</span>
    {:else}
      <span>Published to {success}/{total} ({failed} failed, {timeout} timed out)</span>
      <Anchor
        class="staatliches z-feature rounded-r-md bg-tinted-100-d px-4 py-1 uppercase text-tinted-700-d"
        modal
        href="/publishes">See details</Anchor>
    {/if}
  {:else if $userSettings.send_delay > 0}
    <span
      >Sending reply in {event.created_at +
        Math.ceil($userSettings.send_delay / 1000) -
        $timestamp1} seconds</span>

    <button
      class="ml-2 cursor-pointer rounded-md bg-neutral-100-d px-4 py-1 text-tinted-700-d"
      on:click={() => {
        removeDraft()
      }}>Cancel</button>
  {/if}
</div>
