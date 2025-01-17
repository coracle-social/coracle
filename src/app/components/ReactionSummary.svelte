<script lang="ts">
  import {onMount} from "svelte"
  import {groupBy, uniq, uniqBy, batch} from "@welshman/lib"
  import {REACTION, getTag, REPORT, DELETE} from "@welshman/util"
  import type {TrustedEvent} from "@welshman/util"
  import {deriveEvents} from "@welshman/store"
  import {pubkey, repository, load, displayProfileByPubkey} from "@welshman/app"
  import {displayList} from "@lib/util"
  import {isMobile} from "@lib/html"
  import Icon from "@lib/components/Icon.svelte"
  import EventReportDetails from "@app/components/EventReportDetails.svelte"
  import {displayReaction} from "@app/state"
  import {pushModal} from "@app/modal"

  export let event
  export let onReactionClick
  export let url = ""
  export let reactionClass = ""
  export let noTooltip = false

  const reports = deriveEvents(repository, {
    filters: [{kinds: [REPORT], "#e": [event.id]}],
  })

  const reactions = deriveEvents(repository, {
    filters: [{kinds: [REACTION], "#e": [event.id]}],
  })

  const onReportClick = () => pushModal(EventReportDetails, {url, event})

  $: reportReasons = uniq($reports.map(e => getTag("e", e.tags)?.[2]))

  $: groupedReactions = groupBy(
    e => e.content,
    uniqBy(e => e.pubkey + e.content, $reactions),
  )

  onMount(() => {
    if (url) {
      load({
        relays: [url],
        filters: [{kinds: [REACTION, REPORT, DELETE], "#e": [event.id]}],
        onEvent: batch(300, (events: TrustedEvent[]) => {
          load({
            relays: [url],
            filters: [{kinds: [DELETE], "#e": events.map(e => e.id)}],
          })
        }),
      })
    }
  })
</script>

{#if $reactions.length > 0 || $reports.length > 0}
  <div class="flex min-w-0 flex-wrap gap-2">
    {#if url && $reports.length > 0}
      <button
        type="button"
        data-tip="{`This content has been reported as "${displayList(reportReasons)}".`}}"
        class="btn btn-error btn-xs tooltip-right flex items-center gap-1 rounded-full"
        class:tooltip={!noTooltip && !isMobile}
        on:click|preventDefault|stopPropagation={onReportClick}>
        <Icon icon="danger" />
        <span>{$reports.length}</span>
      </button>
    {/if}
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
