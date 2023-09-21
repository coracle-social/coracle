<script lang="ts">
  import {onMount, onDestroy} from "svelte"
  import {readable} from "svelte/store"
  import {FeedLoader} from "src/engine"
  import {last, equals} from "ramda"
  import {fly} from "src/util/transition"
  import {quantify} from "hurdak"
  import {createScroller} from "src/util/misc"
  import Spinner from "src/partials/Spinner.svelte"
  import Modal from "src/partials/Modal.svelte"
  import Content from "src/partials/Content.svelte"
  import FeedControls from "src/app/shared/FeedControls.svelte"
  import RelayFeed from "src/app/shared/RelayFeed.svelte"
  import Note from "src/app/shared/Note.svelte"
  import type {DynamicFilter} from "src/engine"
  import {compileFilter, searchableRelays, getRelaysFromFilters} from "src/engine"

  export let relays = []
  export let filter = {} as DynamicFilter
  export let invertColors = false
  export let hideControls = false
  export let queryCache = false
  export let onEvent = null

  let scroller, feed, scrollerElement
  let feedRelay = null
  let feedScroller = null
  let oldNotes = readable([])
  let newNotes = readable([])

  const getModal = () => last(Array.from(document.querySelectorAll(".modal-content")))

  const setFeedRelay = relay => {
    feedRelay = relay

    setTimeout(() => {
      feedScroller?.stop()
      feedScroller = !relay ? null : createScroller(loadMore, {element: getModal()})
    }, 300)
  }

  const loadBufferedNotes = () => {
    feed.loadStream()

    document.body.scrollIntoView({behavior: "smooth"})
  }

  const getRelays = () => {
    let selection = relays

    // If we have a search term we need to use only relays that support search
    if (selection.length === 0 && filter.search) {
      selection = $searchableRelays
    }

    if (selection.length === 0) {
      selection = getRelaysFromFilters([compileFilter(filter)])
    }

    if (queryCache) {
      selection = [...selection, "local://coracle.relay"]
    }

    return selection
  }

  const loadMore = () => feed.load(5)

  export const stop = () => {
    feed?.stop()
    scroller?.stop()
    feedScroller?.stop()
  }

  export const start = (newFilter = null) => {
    if (!equals(newFilter, filter)) {
      stop()

      if (newFilter) {
        filter = newFilter
      }

      feed = new FeedLoader({
        depth: 2,
        relays: getRelays(),
        filters: [compileFilter(filter)],
        shouldListen: true,
        shouldLoadParents: true,
        onEvent,
      })

      oldNotes = feed.notes
      newNotes = feed.stream

      scroller = createScroller(loadMore, {element: scrollerElement})
    }
  }

  onMount(() => {
    scrollerElement = getModal()
    start()
  })

  onDestroy(stop)
</script>

<Content size="inherit" gap="gap-6">
  {#if $newNotes?.length > 0}
    <div class="pointer-events-none fixed bottom-0 left-0 z-20 mb-8 flex w-full justify-center">
      <button
        in:fly={{y: 20}}
        class="pointer-events-auto cursor-pointer rounded-full border border-solid
               border-accent-light bg-accent px-4 py-2 text-center text-white
               shadow-lg transition-colors hover:bg-accent-light"
        on:click={loadBufferedNotes}>
        Load {quantify($newNotes.length, "new note")}
      </button>
    </div>
  {/if}

  {#if !hideControls}
    <FeedControls {filter} onChange={start}>
      <slot name="controls" slot="controls" />
    </FeedControls>
  {/if}

  <div class="flex flex-col gap-4">
    {#each $oldNotes as note (note.id)}
      <Note depth={2} {note} {feedRelay} {setFeedRelay} {invertColors} />
    {/each}
  </div>

  <Spinner />
</Content>

{#if feedRelay}
  <Modal onEscape={() => setFeedRelay(null)}>
    <RelayFeed {feedRelay} notes={$oldNotes} depth={2} />
  </Modal>
{/if}
