<script lang="ts">
  import {insertAt, addToMapKey, parseJson} from "@welshman/lib"
  import type {TrustedEvent} from "@welshman/util"
  import {Router, addMaximalFallbacks} from "@welshman/router"
  import {
    getIdOrAddress,
    getIdFilters,
    getParentIdsAndAddrs,
    getParentIdOrAddr,
    verifyEvent,
    ZAP_RESPONSE,
  } from "@welshman/util"
  import {repository} from "@welshman/app"
  import {repostKinds, reactionKinds} from "src/util/nostr"
  import {isEventMuted, myLoad} from "src/engine"
  import {getValidZap} from "src/app/util"

  type GetContext = (event: TrustedEvent) => TrustedEvent[]
  type ShouldAddEvent = (event: TrustedEvent, getContext: GetContext) => boolean

  export let events: TrustedEvent[]
  export let depth = 0
  export let showMuted = false
  export let hideReplies = false
  export let showDeleted = false
  export let shouldSort = false
  export let shouldAwait = false
  export let shouldAddEvent: ShouldAddEvent = undefined
  export let items: TrustedEvent[] = []

  const timestamps = new Map<string, number>()
  const context = new Map<string, Set<TrustedEvent>>()

  const shouldSkip = (event: TrustedEvent, strict: boolean) => {
    if (!showMuted && $isEventMuted(event, strict)) return true
    if (!showDeleted && repository.isDeleted(event)) return true
    if (hideReplies && getParentIdOrAddr(event)) return true
    if (timestamps.has(getIdOrAddress(event))) return true

    return false
  }

  const getParent = async (event: TrustedEvent) => {
    if (repostKinds.includes(event.kind)) {
      const parent = parseJson(event.content)

      if (parent && verifyEvent(parent)) {
        return parent
      }
    }

    const parentIds = getParentIdsAndAddrs(event)

    if (parentIds.length > 0) {
      const filters = getIdFilters(parentIds)
      const [cached] = repository.query(filters)

      if (cached) return cached

      const relays = Router.get().EventParents(event).policy(addMaximalFallbacks).getUrls()
      const [parent] = await myLoad({filters, relays})

      return parent
    }
  }

  const addEvent = async (event: TrustedEvent) => {
    const original = event
    let currentDepth = depth

    timestamps.set(getIdOrAddress(event), original.created_at)

    while (currentDepth > 0) {
      const parent = await getParent(event)

      // Unable to get the parent? we're done traversing parents
      if (!parent) {
        break
      }

      // Skip zaps that fail our zapper check
      if (event.kind === ZAP_RESPONSE && !(await getValidZap(event, parent))) {
        return
      }

      // Link the events, even if we end up skipping this one (since we deduplicate)
      addToMapKey(context, getIdOrAddress(parent), event)

      // Hide replies to deleted/muted parents, or parents we've already seen
      if (shouldSkip(parent, true)) {
        return
      }

      timestamps.set(getIdOrAddress(parent), original.created_at)
      currentDepth--
      event = parent
    }

    // If it's not displayable, skip it
    if ([...repostKinds, ...reactionKinds].includes(event.kind)) return

    // If the caller wants to skip it, skip it
    if (shouldAddEvent && !shouldAddEvent(event, getContext)) return

    let inserted = false

    if (shouldSort) {
      for (let i = 0; i < items.length; i++) {
        if (timestamps.get(getIdOrAddress(items[i])) < original.created_at) {
          items = insertAt(i, event, items)
          inserted = true
          break
        }
      }
    }

    if (!inserted) {
      items = [...items, event]
    }
  }

  const addEvents = async (events: TrustedEvent[]) => {
    for (const event of events) {
      if (!shouldSkip(event, false)) {
        const promise = addEvent(event)

        if (shouldAwait) {
          await promise
        }
      }
    }
  }

  const getContext = (event: TrustedEvent) => Array.from(context.get(getIdOrAddress(event)) || [])

  $: addEvents(events)
</script>

{#each items as event, i (event.id)}
  <slot {i} {event} {getContext} />
{/each}
