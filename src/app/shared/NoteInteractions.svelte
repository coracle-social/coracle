<script lang="ts">
  import {pubkey} from "@welshman/app"
  import {max, pluck, uniq} from "@welshman/lib"
  import type {TrustedEvent} from "@welshman/util"
  import {formatTimestamp} from "src/util/misc"
  import PeopleAction from "./PeopleAction.svelte"

  export let context: TrustedEvent[]
  export let event: TrustedEvent
</script>

<div class="flex items-center justify-between">
  {#if context.length === 0}
    <PeopleAction pubkeys={[event.pubkey]} actionText="mentioned you" />
  {:else if event.pubkey === $pubkey}
    <PeopleAction pubkeys={uniq(pluck("pubkey", context))} actionText="replied to your note" />
  {:else}
    <PeopleAction
      pubkeys={uniq(pluck("pubkey", context))}
      actionText="replied to a note mentioning you" />
  {/if}
  <small>{formatTimestamp(max(pluck("created_at", [event, ...context])))}</small>
</div>
