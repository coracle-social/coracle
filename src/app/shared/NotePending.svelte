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
  import {thunks, type Thunk} from "@welshman/app"
  import {PublishStatus} from "@welshman/net"
  import {now} from "@welshman/signer"
  import {getAncestorTagValues, LOCAL_RELAY_URL, type TrustedEvent} from "@welshman/util"
  import {tweened} from "svelte/motion"
  import {userSettings} from "src/engine"
  import Anchor from "src/partials/Anchor.svelte"
  import {timestamp1} from "src/util/misc"
  import {isMobile} from "src/util/html"
  import {openReplies} from "src/app/state"

  const rendered = now()

  export let event: TrustedEvent

  let innerWidth = 0

  $: ancestors = getAncestorTagValues(event.tags || [])
  $: parent = ancestors.replies[0]
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
  $: total = relays?.length || 0

  const completed = tweened(0)

  $: {
    if (thunk && statuses.length > 0) {
      $completed = ((total - pendings) / total) * 80
    }
  }

  $: isPending = pendings > 0
  $: isCompleted = total === success + failed + timeout
</script>

<svelte:window bind:innerWidth />

<div
  class="loading-bar-content relative flex h-6 w-full items-center justify-between overflow-hidden rounded-md pl-4 text-sm"
  class:bg-neutral-500={thunk && (isPending || isCompleted)}
  class:border={!(isPending || isCompleted)}
  class:px-4={thunk && isPending}
  on:click|stopPropagation>
  {#if thunk && (isPending || isCompleted)}
    <div
      class="loading-bar absolute left-0 top-0 h-full bg-accent"
      style="width: {20 + $completed}%" />
    {#if isPending}
      <span>Publishing...</span>
      <span>{total - pendings} of {total} relays</span>
    {:else}
      <span
        >Published to {success}/{total}
        {#if (failed > 0 || timeout > 0) && !isMobile}
          ({#if failed > 0}{failed} failed{/if}
          {#if failed > 0 && timeout > 0},{/if}
          {#if timeout > 0}{timeout} timed out{/if})
        {/if}
      </span>
      <Anchor
        class="staatliches z-feature rounded-r-md bg-tinted-100-d px-4 py-1 uppercase text-tinted-700-d"
        modal
        href="/publishes">See details</Anchor>
    {/if}
  {:else if $userSettings.send_delay > 0}
    <span>
      {isMobile ? "Sending in" : "Sending reply in"}
      {rendered + Math.ceil($userSettings.send_delay / 1000) - $timestamp1}
      {isMobile ? "s" : "seconds"}
    </span>
    <button
      class="ml-2 cursor-pointer rounded-md bg-neutral-100-d px-4 py-1 text-tinted-700-d"
      on:click={() => {
        thunk.controller.abort()
        $openReplies[parent] = true
      }}>Cancel</button>
  {/if}
</div>
