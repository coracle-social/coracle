<script lang="ts">
  import {onDestroy} from "svelte"
  import {identity, noop, nth, sortBy, uniq, uniqBy} from "@welshman/lib"
  import type {TrustedEvent} from "@welshman/util"
  import {
    getIdAndAddress,
    getIdFilters,
    hexTags,
    isRelayUrl,
    matchTags,
    outbox,
    relays as relaySelections,
  } from "@welshman/util"
  import Button from "src/partials/Button.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import FeedItem from "src/app/shared/FeedItem.svelte"
  import {deriveEvent, getAncestors, getAncestorTags, myRequest} from "src/engine"
  import {resolveRelays} from "src/engine/core"
  import {quantify} from "src/util/misc"

  export let id = null
  export let address = null
  export let relays

  const event = deriveEvent(id || address, {relays})

  // Router.EventParents is gone: it routed to the write relays of whoever authored the parent
  // (weighted heavily), then to those of anyone mentioned, then to the relay hints carried on
  // either set of tags.
  const parentRelays = (event: TrustedEvent) => {
    const parentTags = getAncestorTags(event).replies
    const mentions = matchTags(hexTags("p"), event.tags)
    const authors = parentTags.map(nth(3)).filter(pubkey => pubkey?.length === 64)
    const hints = uniq(
      [...parentTags, ...mentions].map(nth(2)).filter(url => url && isRelayUrl(url)),
    )

    return resolveRelays([
      ...authors.map(pubkey => outbox(pubkey, 10)),
      ...mentions.map(nth(1)).map(pubkey => outbox(pubkey)),
      ...relaySelections(hints),
    ])
  }

  const loadParents = async (event: TrustedEvent) => {
    if (stopped) {
      return
    }

    const {roots, replies} = getAncestors(event)
    const seen = new Set(getThread().flatMap(getIdAndAddress))
    const filteredIds = [...roots, ...replies].filter(id => id && !seen.has(id))

    if (filteredIds.length > 0) {
      // Relay selection is asynchronous now, so re-check that we haven't been torn down
      const parentUrls = await parentRelays(event)

      if (stopped) {
        return
      }

      myRequest({
        autoClose: true,
        relays: parentUrls,
        filters: getIdFilters(filteredIds),
        onEvent: (event: TrustedEvent) => {
          addToThread(event)
          loadParents(event).catch(noop)
        },
      })
    }
  }

  // Thread building

  const getThread = () => [root, ...ancestors, parent].filter(identity)

  const addToThread = (newEvent: TrustedEvent) => {
    const ids = getIdAndAddress(newEvent)
    const {roots, replies} = getAncestors($event)

    if (replies.some(id => ids.includes(id))) {
      parent = newEvent
    } else if (roots.some(id => ids.includes(id))) {
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

  $: {
    if ($event) {
      loadParents($event).catch(noop)
    }
  }

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
    <Button
      class="text-center text-neutral-100"
      on:click={() => {
        showAncestors = true
      }}>
      <i class="fa fa-up-down pr-2 text-sm" />
      Show {quantify(ancestors.length, "other note")}
    </Button>
  {/if}
  <FeedItem topLevel showParent={false} note={parent} />
  <FeedItem topLevel showParent={false} note={$event} depth={2} />
{/if}
