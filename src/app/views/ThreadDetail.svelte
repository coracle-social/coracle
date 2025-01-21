<script lang="ts">
  import {onMount, onDestroy} from "svelte"
  import {quantify} from "hurdak"
  import {identity, sortBy, uniqBy, ctx} from "@welshman/lib"
  import type {TrustedEvent} from "@welshman/util"
  import {
    getParentIdsAndAddrs,
    getIdAndAddress,
    getIdOrAddress,
    getIdFilters,
    getReplyTagValues,
  } from "@welshman/util"
  import {load} from "@welshman/app"
  import Anchor from "src/partials/Anchor.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import FeedItem from "src/app/shared/FeedItem.svelte"
  import {deriveEvent} from "src/engine"

  export let id = null
  export let address = null
  export let relays

  const event = deriveEvent(id || address, {relays})

  const loadParents = (event: TrustedEvent) => {
    if (stopped) {
      return
    }

    const ids = getParentIdsAndAddrs(event)
    const seen = new Set(getThread().flatMap(getIdAndAddress))
    const filteredIds = ids.filter(id => id && !seen.has(id))

    if (filteredIds.length > 0) {
      load({
        relays: ctx.app.router.EventParents(event).getUrls(),
        filters: getIdFilters(filteredIds),
        onEvent: (event: TrustedEvent) => {
          addToThread(event)
          loadParents(event)
        },
      })
    }
  }

  // Thread building

  const getThread = () => [root, ...ancestors, parent].filter(identity)

  const addToThread = (newEvent: TrustedEvent) => {
    const ids = getIdOrAddress(newEvent)
    const {roots, replies} = getReplyTagValues($event.tags)

    if (replies.find(id => ids.includes(id))) {
      parent = newEvent
    } else if (roots.find(id => ids.includes(id))) {
      root = newEvent
    } else {
      ancestors = sortBy(
        e => e.created_at,
        uniqBy(e => e.id, [...ancestors, newEvent]),
      )
    }
  }

  let stopped = false
  let showAncestors = false
  let parent, root
  let ancestors = []

  onMount(() => {
    loadParents($event)
  })

  onDestroy(() => {
    stopped = true
  })
</script>

{#if !$event || !root || !parent}
  <Spinner />
{:else}
  <FeedItem note={root} />
  {#if showAncestors}
    {#each ancestors as ancestor (ancestor.id)}
      <FeedItem topLevel showParent={false} note={ancestor} />
    {/each}
  {:else if ancestors.length > 0}
    <Anchor
      class="text-center text-neutral-100"
      on:click={() => {
        showAncestors = true
      }}>
      <i class="fa fa-up-down pr-2 text-sm" />
      Show {quantify(ancestors.length, "other note")}
    </Anchor>
  {/if}
  <FeedItem topLevel showParent={false} note={parent} />
  <FeedItem topLevel showParent={false} note={$event} depth={2} />
{/if}
