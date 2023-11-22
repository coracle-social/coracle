<script lang="ts">
  import {uniq, pluck} from 'ramda'
  import {Tags} from 'paravel'
  import PersonLink from 'src/app/shared/PersonLink.svelte'
  import GroupLink from 'src/app/shared/GroupLink.svelte'
  import type {DisplayEvent} from 'src/engine'

  export let note: DisplayEvent
  export let showGroup

  const repostPubkeys = uniq(pluck('pubkey', note.reposts || []))
  const addresses = Tags.from(note).communities().all()
</script>

{#if repostPubkeys.length > 0}
  <p class="flex gap-1 pb-2 text-gray-4 items-center text-sm">
    <i class="fa fa-rotate" />
    Reposted by
    {#if repostPubkeys.length === 1}
      <PersonLink pubkey={repostPubkeys[0]} />
    {:else}
      {repostPubkeys.length} people
    {/if}
    {#if showGroup}
      {#if addresses.length === 1}
        in <GroupLink address={addresses[0]} />
      {:else if addresses.length > 1}
        in {addresses.length} groups
      {/if}
    {/if}
  </p>
{:else if addresses.length > 0 && showGroup}
  <p class="pb-2 text-gray-4">
    {#if addresses.length === 1}
      Posted in <GroupLink address={addresses[0]} />
    {:else if addresses.length > 1}
      Posted in {addresses.length} groups
    {/if}
  </p>
{/if}
