<script lang="ts">
  import {onMount} from "svelte"
  import {groupBy, uniqBy} from "@welshman/lib"
  import {REACTION} from "@welshman/util"
  import {deriveEvents} from "@welshman/store"
  import {pubkey, repository, load} from "@welshman/app"
  import {displayReaction} from "@app/state"

  export let event
  export let onReactionClick
  export let relays: string[] = []

  const filters = [{kinds: [REACTION], "#e": [event.id]}]
  const reactions = deriveEvents(repository, {filters})

  $: groupedReactions = groupBy(
    e => e.content,
    uniqBy(e => e.pubkey + e.content, $reactions),
  )

  onMount(() => {
    load({relays, filters})
  })
</script>

{#if $reactions.length > 0}
  <div class="flex min-w-0 flex-wrap gap-2">
    {#each groupedReactions.entries() as [content, events]}
      {@const isOwn = events.some(e => e.pubkey === $pubkey)}
      {@const onClick = () => onReactionClick(content, events)}
      <button
        type="button"
        class="flex-inline btn btn-neutral btn-xs gap-1 rounded-full"
        class:border={isOwn}
        class:border-solid={isOwn}
        class:border-primary={isOwn}
        on:click|preventDefault|stopPropagation={onClick}>
        <span>{displayReaction(content)}</span>
        {#if events.length > 1}
          <span>{events.length}</span>
        {/if}
      </button>
    {/each}
    <slot />
  </div>
{/if}
