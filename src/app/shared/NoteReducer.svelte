<script lang="ts">
  import {ctx, max, pushToMapKey, parseJson} from "@welshman/lib"
  import type {TrustedEvent} from "@welshman/util"
  import {
    getIdOrAddress,
    getIdFilters,
    getParentIdsAndAddrs,
    getParentIdOrAddr,
    hasValidSignature,
  } from "@welshman/util"
  import {load, repository} from "@welshman/app"
  import {repostKinds, reactionKinds} from "src/util/nostr"
  import {isEventMuted} from "src/engine"

  export let events: TrustedEvent[]
  export let depth = 0
  export let showMuted = false
  export let hideReplies = false
  export let showDeleted = false
  export let items: TrustedEvent[] = []

  const seenAtDepth = new Map<string, number[]>()

  const context = new Map<string, TrustedEvent[]>()

  const shouldSkip = (event: TrustedEvent) => {
    if (!showMuted && $isEventMuted(event, true)) return true
    if (!showDeleted && repository.isDeleted(event)) return true
    if (hideReplies && getParentIdOrAddr(event)) return true

    return false
  }

  const addItem = (event: TrustedEvent, currentDepth = depth) => {
    if (shouldSkip(event)) return

    const idOrAddress = getIdOrAddress(event)
    const parentIds = getParentIdsAndAddrs(event)

    // Force loading parents of reactions/reposts
    if ([...repostKinds, ...reactionKinds].includes(event.kind)) {
      currentDepth = Math.max(1, currentDepth)
    }

    // If we have no parents, or we're at depth 0, we're done
    if (parentIds.length === 0 || currentDepth === 0) {
      const parentDepth = max(parentIds.flatMap(id => seenAtDepth.get(id) || []))

      // Only add the note if we haven't seen it before elsewhere
      if (parentDepth === 0 && !seenAtDepth.has(idOrAddress)) {
        items = [...items, event]
      }
    } else {
      for (const id of parentIds) {
        pushToMapKey(context, id, event)
      }

      // Otherwise, load our parent and show that instead
      load({
        filters: getIdFilters(parentIds),
        relays: ctx.app.router.EventParents(event).getUrls(),
        onEvent: (parentEvent: TrustedEvent) => {
          addItem(parentEvent, currentDepth - 1)
        },
      })
    }

    pushToMapKey(seenAtDepth, idOrAddress, currentDepth)
  }

  const addRepost = (repost: TrustedEvent) => {
    const event = parseJson(repost.content)

    if (event && hasValidSignature(event)) {
      pushToMapKey(context, getIdOrAddress(event), repost)
      addItem(event)
    }
  }

  let i = 0

  $: {
    for (const event of events.slice(i)) {
      if (shouldSkip(event)) continue

      if (repostKinds.includes(event.kind)) {
        addRepost(event)
      } else {
        addItem(event)
      }
    }

    // Don't process the same events multiple times
    i = events.length - 1
  }
</script>

{#each items as event, i (event.id)}
  <slot {i} {event} context={context.get(event.id) || []} />
{/each}
