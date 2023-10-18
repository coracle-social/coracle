<script lang="ts">
  import {onMount} from "svelte"
  import {reject} from "ramda"
  import {Storage} from "hurdak"
  import {FeedLoader} from "src/engine"
  import {createScroller} from "src/util/misc"
  import {fly} from "src/util/transition"
  import {getModal} from "src/partials/state"
  import Spinner from "src/partials/Spinner.svelte"
  import Content from "src/partials/Content.svelte"
  import FeedControls from "src/app/shared/FeedControls.svelte"
  import Note from "src/app/shared/Note.svelte"
  import type {Event, DynamicFilter} from "src/engine"
  import {
    readable,
    writable,
    compileFilter,
    searchableRelays,
    getRelaysFromFilters,
  } from "src/engine"

  export let relays = []
  export let filter: DynamicFilter = {}
  export let hideControls = false
  export let showGroup = false
  export let noCache = false
  export let onEvent = null

  let feed
  let notes = readable([])
  let hideReplies = writable(Storage.getJson("hideReplies"))

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

  const start = () => {
    feed?.stop()

    feed = new FeedLoader({
      filters: [compileFilter(filter)],
      relays: getRelays(),
      shouldDefer: true,
      shouldLoadParents: true,
      shouldHideReplies: $hideReplies,
      onEvent,
    })

    notes = feed.notes

    if (noCache) {
      notes = notes.derived(reject((e: Event) => e.seen_on.length === 0))
    }
  }

  const updateFilter = newFilter => {
    filter = newFilter

    start()
  }

  hideReplies.subscribe($hideReplies => {
    start()
    Storage.setJson("hideReplies", $hideReplies)
  })

  onMount(() => {
    start()

    const scroller = createScroller(loadMore, {element: getModal()})

    return () => {
      feed?.stop()
      scroller?.stop()
    }
  })
</script>

<Content size="inherit" gap="gap-6">
  {#if !hideControls}
    <FeedControls {hideReplies} {filter} {relays} {updateFilter}>
      <slot name="controls" slot="controls" />
    </FeedControls>
  {/if}
  <div class="flex flex-col gap-4">
    {#each $notes as note, i (note.id)}
      <div in:fly={{y: 20}}>
        <Note
          depth={$hideReplies ? 0 : 2}
          context={note.replies || []}
          filters={[compileFilter(filter)]}
          {showGroup}
          {note} />
      </div>
    {/each}
  </div>
  <Spinner />
</Content>
