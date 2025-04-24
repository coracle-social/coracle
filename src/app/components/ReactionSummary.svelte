<script lang="ts">
  import {onMount} from "svelte"
  import type {Snippet} from "svelte"
  import {groupBy, uniq, uniqBy, batch, displayList} from "@welshman/lib"
  import {REACTION, getReplyFilters, getTag, REPORT, DELETE} from "@welshman/util"
  import type {TrustedEvent} from "@welshman/util"
  import {deriveEvents} from "@welshman/store"
  import {load} from "@welshman/net"
  import {pubkey, repository, displayProfileByPubkey} from "@welshman/app"
  import {isMobile, preventDefault, stopPropagation} from "@lib/html"
  import Icon from "@lib/components/Icon.svelte"
  import EventReportDetails from "@app/components/EventReportDetails.svelte"
  import {displayReaction} from "@app/state"
  import {pushModal} from "@app/modal"

  interface Props {
    event: any
    onReactionClick: any
    url?: string
    reactionClass?: string
    noTooltip?: boolean
    children?: Snippet
  }

  const {
    event,
    onReactionClick,
    url = "",
    reactionClass = "",
    noTooltip = false,
    children,
  }: Props = $props()

  const reports = deriveEvents(repository, {
    filters: [{kinds: [REPORT], "#e": [event.id]}],
  })

  const reactions = deriveEvents(repository, {
    filters: [{kinds: [REACTION], "#e": [event.id]}],
  })

  const onReportClick = () => pushModal(EventReportDetails, {url, event})

  const reportReasons = $derived(uniq($reports.map(e => getTag("e", e.tags)?.[2])))

  const groupedReactions = $derived(
    groupBy(
      e => e.content,
      uniqBy(e => e.pubkey + e.content, $reactions),
    ),
  )

  onMount(() => {
    const controller = new AbortController()

    if (url) {
      load({
        relays: [url],
        signal: controller.signal,
        filters: getReplyFilters([event], {kinds: [REACTION, REPORT, DELETE]}),
        onEvent: batch(300, (events: TrustedEvent[]) => {
          load({
            relays: [url],
            filters: getReplyFilters(events, {kinds: [DELETE]}),
          })
        }),
      })
    }

    return () => {
      controller.abort()
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
        onclick={stopPropagation(preventDefault(onReportClick))}>
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
        onclick={stopPropagation(preventDefault(onClick))}>
        <span>{displayReaction(content)}</span>
        {#if events.length > 1}
          <span>{events.length}</span>
        {/if}
      </button>
    {/each}
    {@render children?.()}
  </div>
{/if}
