<script lang="ts">
  import {onMount} from "svelte"
  import {groupBy, uniqBy, batch} from "@welshman/lib"
  import {REACTION, DELETE} from "@welshman/util"
  import type {TrustedEvent} from "@welshman/util"
  import {deriveEvents} from "@welshman/store"
  import {pubkey, repository, load, displayProfileByPubkey} from "@welshman/app"
  import {displayList} from "@lib/util"
  import {isMobile} from "@lib/html"
  import {displayReaction} from "@app/state"

  export let event
  export let onReactionClick
  export let relays: string[] = []
  export let reactionClass = ""
  export let noTooltip = false

  const reactions = deriveEvents(repository, {
    filters: [{kinds: [REACTION], "#e": [event.id]}],
  })

  $: groupedReactions = groupBy(
    e => e.content,
    uniqBy(e => e.pubkey + e.content, $reactions),
  )

  onMount(() => {
    load({
      relays,
      filters: [{kinds: [REACTION, DELETE], "#e": [event.id]}],
      onEvent: batch(300, (events: TrustedEvent[]) => {
        load({
          relays,
          filters: [{kinds: [DELETE], "#e": events.map(e => e.id)}],
        })
      }),
    })
  })
</script>

{#if $reactions.length > 0}
  <div class="flex min-w-0 flex-wrap gap-2">
    {#each groupedReactions.entries() as [content, events]}
      {@const pubkeys = events.map(e => e.pubkey)}
      {@const isOwn = $pubkey && pubkeys.includes($pubkey)}
      {@const info = displayList(pubkeys.map(pubkey => displayProfileByPubkey(pubkey)))}
      {@const tooltip = `${info} reacted ${displayReaction(content)}`}
      {@const onClick = () => onReactionClick(content, events)}
      <button
        type="button"
        data-tip={tooltip}
        class="flex-inline btn btn-neutral btn-xs gap-1 rounded-full {reactionClass}"
        class:tooltip={!noTooltip && !isMobile}
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
