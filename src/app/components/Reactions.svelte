<script lang="ts">
  import {groupBy, uniqBy} from "@welshman/lib"
  import {REACTION} from "@welshman/util"
  import {deriveEvents} from "@welshman/store"
  import {pubkey, repository} from "@welshman/app"
  import Icon from "@lib/components/Icon.svelte"
  import {REPLY, displayReaction} from "@app/state"

  export let event
  export let onReactionClick
  export let showReplies = false

  const reactions = deriveEvents(repository, {filters: [{kinds: [REACTION], "#e": [event.id]}]})
  const replies = deriveEvents(repository, {filters: [{kinds: [REPLY], "#E": [event.id]}]})
</script>

{#if $reactions.length > 0 || $replies.length > 0}
  <div class="ml-12 flex flex-wrap gap-2 text-xs">
    {#if $replies.length > 0 && showReplies}
      <div class="flex-inline btn btn-neutral btn-xs gap-1 rounded-full">
        <Icon icon="reply" />
        {$replies.length}
      </div>
    {/if}
    {#each groupBy( e => e.content, uniqBy(e => e.pubkey + e.content, $reactions), ).entries() as [content, events]}
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
