<script lang="ts">
  import {groupBy, uniqBy} from "@welshman/lib"
  import {REACTION} from "@welshman/util"
  import {deriveEvents} from "@welshman/store"
  import {pubkey, repository} from "@welshman/app"
  import {displayReaction} from "@app/state"

  export let event
  export let onReactionClick

  const reactions = deriveEvents(repository, {filters: [{kinds: [REACTION], "#e": [event.id]}]})

  $: groupedReactions = groupBy(
    e => e.content,
    uniqBy(e => e.pubkey + e.content, $reactions),
  )
</script>

{#if $reactions.length > 0}
  <div class="flex gap-2">
    {#each groupedReactions.entries() as [content, events]}
      {@const isOwn = events.some(e => e.pubkey === $pubkey)}
      {@const onClick = () => onReactionClick(content, events)}
      <button
        type="button"
        class="flex-inline btn btn-neutral btn-xs gap-1 rounded-full"
        class:border={isOwn}
        class:border-solid={isOwn}
        class:border-primary={isOwn}
        on:click|stopPropagation={onClick}>
        <span>{displayReaction(content)}</span>
        {#if events.length > 1}
          <span>{events.length}</span>
        {/if}
      </button>
    {/each}
  </div>
{/if}
