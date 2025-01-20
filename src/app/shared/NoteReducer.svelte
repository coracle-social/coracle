<script lang="ts">
  import {ctx, pushToMapKey, parseJson} from "@welshman/lib"
  import type {TrustedEvent} from "@welshman/util"
  import {
    getIdOrAddress,
    getIdFilters,
    getParentIdsAndAddrs,
    getParentIdOrAddr,
    hasValidSignature,
  } from "@welshman/util"
  import {load, repository} from "@welshman/app"
  import {repostKinds} from "src/util/nostr"
  import {isEventMuted} from "src/engine"

  export let events: TrustedEvent[]
  export let depth = 0
  export let showMuted = false
  export let hideReplies = false
  export let showDeleted = false

  const seen = new Set<string>()
  const context = new Map<string, TrustedEvent[]>()

  const shouldSkip = (event: TrustedEvent) => {
    if (!showMuted && $isEventMuted(event, true)) return true
    if (!showDeleted && repository.isDeleted(event)) return true
    if (hideReplies && getParentIdOrAddr(event)) return true

    return false
  }

  const addItem = (event: TrustedEvent, interaction?: TrustedEvent, currentDepth = depth) => {
    if (shouldSkip(event)) return

    const idOrAddress = getIdOrAddress(event)

    // Keep working our way up the reply chain if we're working with a reply
    if (currentDepth > 0 && getParentIdOrAddr(event)) {
      load({
        relays: ctx.app.router.EventParents(event).getUrls(),
        filters: getIdFilters(getParentIdsAndAddrs(event)),
        onEvent: (parentEvent: TrustedEvent) => {
          addItem(parentEvent, event, currentDepth - 1)
        },
      })
    } else if (!seen.has(idOrAddress)) {
      items.push(event)
    }

    seen.add(idOrAddress)

    if (interaction) {
      pushToMapKey(context, idOrAddress, interaction)
    }
  }

  const addRepost = (repost: TrustedEvent) => {
    const event = parseJson(repost.content)

    if (event && hasValidSignature(event)) {
      addItem(event, repost)
    }
  }

  let i = 0
  let items: TrustedEvent[] = []

  $: {
    for (const event of events.slice(i)) {
      if (shouldSkip(event)) continue

      if (repostKinds.includes(event.kind)) {
        addRepost(event)
      } else {
        addItem(event)
      }
    }

    // Trigger render
    items = items
    i = events.length - 1
  }
</script>

{#each items as event, i (event.id)}
  <slot {i} {event} context={context.get(event.id) || []} />
{/each}
