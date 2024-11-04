<script lang="ts">
  import {uniq, pluck} from "ramda"
  import PersonLink from "src/app/shared/PersonLink.svelte"
  import type {DisplayEvent} from "src/engine"

  export let note: DisplayEvent

  const reposts = note.reposts || []
  const repostPubkeys = uniq(pluck("pubkey", reposts))
</script>

<p class="flex items-center gap-1 pb-2 text-sm text-neutral-300">
  <i class="fa fa-rotate" />
  Reposted by
  {#if repostPubkeys.length === 1}
    <PersonLink pubkey={repostPubkeys[0]} />
  {:else}
    {repostPubkeys.length} people
  {/if}
</p>
