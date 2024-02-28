<script lang="ts">
  import {uniq, pluck} from "ramda"
  import {Tags} from "paravel"
  import PersonLink from "src/app/shared/PersonLink.svelte"
  import GroupLink from "src/app/shared/GroupLink.svelte"
  import type {DisplayEvent} from "src/engine"

  export let note: DisplayEvent
  export let showGroup

  const reposts = note.reposts || []
  const repostPubkeys = uniq(pluck("pubkey", reposts))
  const fromAddresses = Tags.fromEvent(note).context().values().valueOf()
  const toAddresses = Tags.fromEvents(reposts).context().values().valueOf()
</script>

{#if repostPubkeys.length > 0}
  <p class="flex items-center gap-1 pb-2 text-sm text-neutral-300">
    <i class="fa fa-rotate" />
    {#if showGroup}
      Cross-posted
    {:else}
      Reposted
    {/if}
    {#if showGroup}
      {#if fromAddresses.length === 1}
        from <GroupLink address={fromAddresses[0]} />
      {:else if fromAddresses.length > 1}
        from {fromAddresses.length} groups
      {/if}
      {#if toAddresses.length === 1}
        to <GroupLink address={toAddresses[0]} />
      {:else if toAddresses.length > 1}
        to {toAddresses.length} groups
      {/if}
    {/if}
    by
    {#if repostPubkeys.length === 1}
      <PersonLink pubkey={repostPubkeys[0]} />
    {:else}
      {repostPubkeys.length} people
    {/if}
  </p>
{:else if fromAddresses.length > 0 && showGroup}
  <p class="pb-2 text-neutral-300">
    {#if fromAddresses.length === 1}
      Posted in <GroupLink address={fromAddresses[0]} />
    {:else if fromAddresses.length > 1}
      Posted in {fromAddresses.length} groups
    {/if}
  </p>
{/if}
