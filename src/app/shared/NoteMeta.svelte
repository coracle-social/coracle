<script lang="ts">
  import {uniq, pluck} from "@welshman/lib"
  import type {TrustedEvent} from "@welshman/util"
  import {repostKinds} from "src/util/nostr"
  import PersonLink from "src/app/shared/PersonLink.svelte"

  export let event: TrustedEvent
  export let context: TrustedEvent[]

  $: repostPubkeys = uniq(
    pluck(
      "pubkey",
      context.filter(e => repostKinds.includes(e.kind)),
    ),
  )
</script>

{#if repostPubkeys.length > 0}
  <p class="flex items-center gap-1 pb-2 text-sm text-neutral-300">
    <i class="fa fa-rotate" />
    Reposted by
    {#if repostPubkeys.length === 1}
      <PersonLink pubkey={repostPubkeys[0]} />
    {:else}
      {repostPubkeys.length} people
    {/if}
  </p>
{/if}
