<script lang="ts">
  import {pluck, max, uniq, ago} from "@welshman/lib"
  import {getIdFilters} from "@welshman/util"
  import {pubkey} from "@welshman/app"
  import {formatTimestampAsDate, formatTimestamp} from "src/util/misc"
  import FeedItem from "src/app/shared/FeedItem.svelte"
  import NoteReducer from "src/app/shared/NoteReducer.svelte"
  import PeopleAction from "src/app/shared/PeopleAction.svelte"

  export let i
  export let verb
  export let depth
  export let events
  export let interval
  export let notifications

  let items = []

  $: date = formatTimestampAsDate(ago(notifications[i][0], interval))
</script>

{#if i > 0 && formatTimestampAsDate(ago(notifications[i - 1][0], interval)) !== date && items.length > 0}
  <div class="flex items-center gap-4">
    <small class="whitespace-nowrap text-neutral-100">{date}</small>
    <div class="h-px w-full bg-neutral-600" />
  </div>
{/if}

<NoteReducer {events} depth={1} bind:items let:event let:context>
  <div class="flex items-center justify-between">
    {#if context.length === 0}
      <PeopleAction pubkeys={[event.pubkey]} actionText="mentioned you" />
    {:else if event.pubkey === $pubkey}
      <PeopleAction pubkeys={uniq(pluck("pubkey", context))} actionText="{verb} to your note" />
    {:else}
      <PeopleAction
        pubkeys={uniq(pluck("pubkey", context))}
        actionText="{verb} to a note mentioning you" />
    {/if}
    <small>{formatTimestamp(max(pluck('created_at', [event, ...context])))}</small>
  </div>
  <FeedItem topLevel showLoading note={event} {depth} filters={getIdFilters(pluck("id", context))} />
</NoteReducer>
