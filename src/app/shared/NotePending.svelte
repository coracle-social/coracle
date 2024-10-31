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
  import type {SignedEvent} from "@welshman/util"
  import {publishes, userSettings, type Pub} from "src/engine"
  import Anchor from "src/partials/Anchor.svelte"
  import {timestamp1} from "src/util/misc"
  import {spring} from "svelte/motion"

  export let event: SignedEvent & {
    status: string
    remove: () => void
  }

  $: pub = Object.values($publishes).find(p => p.request.event.id === event.id)

  $: pendings = Array.from(pub?.status?.values() || []).filter(s => s === "pending" || !s).length
  $: failed = Array.from(pub?.status?.values() || []).filter(
    s => s === "failure" || s === "aborted",
  ).length
  $: timeout = Array.from(pub?.status?.values() || []).filter(s => s === "timeout").length
  $: success = Array.from(pub?.status?.values() || []).filter(s => s === "success").length
  $: total = pub?.request?.relays.length || 0

  let completed = spring(0)

  $: {
    if (pub) {
      $completed = ((total - pendings) / total) * 100
    }
  }

  $: isPending = pendings > 0
</script>

<div
  class="loading-bar-content relative flex h-6 w-full items-center justify-between overflow-hidden rounded-md pl-4 text-sm"
  class:border={!pub}
  on:click|stopPropagation>
  {#if pub}
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
  {:else}
    <span
      >Sending reply in {event.created_at + $userSettings.undo_delay - $timestamp1} seconds</span>

    <button
      class="ml-2 cursor-pointer rounded-md bg-neutral-100-d px-4 py-1 text-tinted-700-d"
      on:click={() => {
        event.remove()
      }}>Cancel</button>
  {/if}
</div>
