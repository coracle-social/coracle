<script lang="ts">
  import {onMount} from "svelte"
  import {Storage} from "hurdak"
  import {FeedLoader} from "src/engine"
  import {createScroller} from "src/util/misc"
  import {LOCAL_RELAY_URL} from "src/util/nostr"
  import {fly} from "src/util/transition"
  import {getModal} from "src/partials/state"
  import Spinner from "src/partials/Spinner.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import FeedControls from "src/app/shared/FeedControls.svelte"
  import Note from "src/app/shared/Note.svelte"
  import type {DynamicFilter} from "src/engine"
  import {
    readable,
    writable,
    selectHints,
    compileFilters,
    searchableRelays,
    getRelaysFromFilters,
  } from "src/engine"

  export let relays = []
  export let filter: DynamicFilter = {}
  export let anchor = null
  export let shouldDisplay = null
  export let shouldListen = false
  export let hideControls = false
  export let hideSpinner = false
  export let showGroup = false
  export let onEvent = null

  let feed
  let notes = readable([])

  const hideReplies = writable(Storage.getJson("hideReplies"))

  const getRelays = () => {
    let selection = relays

    // If we have a search term we need to use only relays that support search
    if (selection.length === 0 && filter.search) {
      selection = $searchableRelays
    }

    if (selection.length === 0) {
      selection = getRelaysFromFilters(compileFilters([filter]))
    }

    return selectHints(selection).concat(LOCAL_RELAY_URL)
  }

  const loadMore = () => feed.load(5)

  const start = () => {
    feed?.stop()

    feed = new FeedLoader({
      filters: compileFilters([filter], {includeReposts: true}),
      relays: getRelays(),
      anchor,
      shouldListen,
      shouldLoadParents: true,
      shouldHideReplies: $hideReplies,
      onEvent,
    })

    notes = feed.notes

    if (shouldDisplay) {
      notes = notes.derived(xs => xs.filter(shouldDisplay))
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
    const scroller = createScroller(loadMore, {element: getModal()})

    return () => {
      feed?.stop()
      scroller?.stop()
    }
  })
</script>

{#if !hideControls}
  <FeedControls {hideReplies} {filter} {relays} {updateFilter}>
    <slot name="controls" slot="controls" />
  </FeedControls>
{/if}

<FlexColumn xl>
  {#each $notes as note, i (note.id)}
    <div in:fly={{y: 20}}>
      <Note
        depth={$hideReplies ? 0 : 2}
        context={note.replies || []}
        filters={compileFilters([filter])}
        {showGroup}
        {anchor}
        {note} />
    </div>
  {/each}
</FlexColumn>

{#if !hideSpinner}
  <Spinner />
{/if}
