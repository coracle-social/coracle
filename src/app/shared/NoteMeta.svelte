<script lang="ts">
  import {uniq, prop} from "@welshman/lib"
  import type {TrustedEvent} from "@welshman/util"
  import PersonLink from "src/app/shared/PersonLink.svelte"

  export let note: TrustedEvent
  export let reposts: Map<string, TrustedEvent[]>

  const repostPubkeys = uniq((reposts.get(note.id) || []).map(prop("pubkey")))
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
