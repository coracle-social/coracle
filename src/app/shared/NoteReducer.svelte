<script lang="ts">
  import {ctx, insert, addToMapKey, parseJson} from "@welshman/lib"
  import type {TrustedEvent} from "@welshman/util"
  import {
    getIdOrAddress,
    getIdFilters,
    getParentIdsAndAddrs,
    getParentIdOrAddr,
    hasValidSignature,
    ZAP_RESPONSE,
  } from "@welshman/util"
  import {load, repository} from "@welshman/app"
  import {repostKinds, reactionKinds} from "src/util/nostr"
  import {isEventMuted} from "src/engine"
  import {getValidZap} from "src/app/util"

  export let events: TrustedEvent[]
  export let depth = 0
  export let showMuted = false
  export let hideReplies = false
  export let showDeleted = false
  export let shouldSort = false
  export let shouldAwait = false
  export let items: TrustedEvent[] = []

  const timestamps = new Map<string, number>()

  const context = new Map<string, Set<TrustedEvent>>()

  const shouldSkip = (event: TrustedEvent) => {
    if (!showMuted && $isEventMuted(event, true)) return true
    if (!showDeleted && repository.isDeleted(event)) return true
    if (hideReplies && getParentIdOrAddr(event)) return true

    return false
  }

  const getParent = async (event: TrustedEvent) => {
    if (repostKinds.includes(event.kind)) {
      const parent = parseJson(event.content)

      if (parent && hasValidSignature(parent)) {
        return parent
      }
    }

    const parentIds = getParentIdsAndAddrs(event)

    if (parentIds.length > 0) {
      return new Promise(resolve => {
        load({
          filters: getIdFilters(parentIds),
          relays: ctx.app.router.EventParents(event).getUrls(),
          onEvent: resolve,
        })
      })
    }
  }

  const addEvent = async (event: TrustedEvent) => {
    const original = event
    let currentDepth = depth

    while (currentDepth > 0) {
      const parent = await getParent(event)

      if (!parent) {
        break
      }

      // Hide replies to deleted/muted parents
      if (shouldSkip(parent)) {
        return
      }

      // Skip zaps that fail our zapper check
      if (event.kind === ZAP_RESPONSE && !(await getValidZap(event, parent))) {
        return
      }

      addToMapKey(context, getIdOrAddress(parent), event)
      currentDepth--
      event = parent
    }

    const id = getIdOrAddress(event)

    // If we've already seen it, or it's not displayable, skip it
    if (timestamps.has(id) || [...repostKinds, ...reactionKinds].includes(event.kind)) return

    let inserted = false

    if (shouldSort) {
      for (let i = 0; i < items.length; i++) {
        if (timestamps.get(getIdOrAddress(items[i])) < original.created_at) {
          items = insert(i, event, items)
          inserted = true
          break
        }
      }
    }

    if (!inserted) {
      items = [...items, event]
    }

    timestamps.set(id, original.created_at)
  }

  const addEvents = async (events: TrustedEvent[]) => {
    for (const event of events) {
      if (!shouldSkip(event)) {
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
