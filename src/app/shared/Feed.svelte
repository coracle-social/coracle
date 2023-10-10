<script lang="ts">
  import {onMount} from "svelte"
  import {readable} from "svelte/store"
  import {FeedLoader} from "src/engine"
  import {fly} from "src/util/transition"
  import {quantify} from "hurdak"
  import {createScroller} from "src/util/misc"
  import {getModal} from "src/partials/state"
  import Spinner from "src/partials/Spinner.svelte"
  import Content from "src/partials/Content.svelte"
  import FeedControls from "src/app/shared/FeedControls.svelte"
  import Note from "src/app/shared/Note.svelte"
  import type {DynamicFilter} from "src/engine"
  import {compileFilter, searchableRelays, getRelaysFromFilters} from "src/engine"

  export let relays = []
  export let filter = {} as DynamicFilter
  export let hideControls = false
  export let onEvent = null

  let feed
  let oldNotes = readable([])
  let newNotes = readable([])

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

    return selection
  }

  const loadMore = () => feed.load(5)

  onMount(() => {
    feed = new FeedLoader({
      filters: [compileFilter(filter)],
      relays: getRelays(),
      shouldDefer: true,
      shouldListen: true,
      shouldLoadParents: true,
      onEvent,
    })

    oldNotes = feed.notes
    newNotes = feed.stream

    const scroller = createScroller(loadMore, {element: getModal()})

    return () => {
      feed?.stop()
      scroller?.stop()
    }
  })
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
    <FeedControls {filter}>
      <slot name="controls" slot="controls" />
    </FeedControls>
  {/if}

  <div class="flex flex-col gap-4">
    {#each $oldNotes as note (note.id)}
      <Note depth={2} context={note.replies || []} filters={[compileFilter(filter)]} {note} />
    {/each}
  </div>

  <Spinner />
</Content>
